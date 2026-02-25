import { PopoverContent } from "@giselle-internal/ui/popover";
import { defaultName } from "@giselles-ai/node-registry";
import type {
	NodeLike,
	OutputId,
	PropertyMapping,
	SubSchema,
} from "@giselles-ai/protocol";
import { isImageGenerationNode, isOperationNode } from "@giselles-ai/protocol";
import { Search, X } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useMemo, useState } from "react";
import { typeConfig } from "../structured-output/field-type-config";
import type { FieldType } from "../structured-output/types";
import { generateFieldId as generateCandidateId } from "../structured-output/types";
import { getNodeSchema } from "./get-node-schema";

interface SourceCandidateItem {
	id: string;
	label: string;
	source: PropertyMapping["source"];
	depth: number;
	fieldType: FieldType;
}

interface SourceCandidateGroup {
	groupId: string;
	groupLabel: string;
	items: SourceCandidateItem[];
}

function collectCandidatesFromNode(node: NodeLike): SourceCandidateItem[] {
	const candidates: SourceCandidateItem[] = [];
	const nodeName = defaultName(node);
	const structuredSchema = getNodeSchema(node);

	for (const output of node.outputs) {
		const isStructuredOutput =
			structuredSchema && output.accessor === "generated-text";

		if (isStructuredOutput) {
			candidates.push({
				id: generateCandidateId(),
				label: nodeName,
				source: {
					nodeId: node.id,
					outputId: output.id,
					path: [],
				},
				depth: 0,
				fieldType: "object",
			});

			collectSubSchemaItems(
				candidates,
				structuredSchema.properties,
				node,
				output.id,
				nodeName,
				[],
				1,
			);
		} else {
			candidates.push({
				id: generateCandidateId(),
				label: nodeName,
				source: {
					nodeId: node.id,
					outputId: output.id,
					path: [],
				},
				depth: 0,
				fieldType: "string",
			});
		}
	}

	return candidates;
}

function collectSubSchemaItems(
	candidates: SourceCandidateItem[],
	properties: Record<string, SubSchema>,
	node: NodeLike,
	outputId: OutputId,
	nodeName: string,
	parentPath: string[],
	depth: number,
) {
	for (const [key, subSchema] of Object.entries(properties)) {
		const path = [...parentPath, key];
		const fieldType = subSchema.type;
		candidates.push({
			id: generateCandidateId(),
			label: key,
			source: {
				nodeId: node.id,
				outputId,
				path,
			},
			depth,
			fieldType,
		});

		if (subSchema.type === "object") {
			collectSubSchemaItems(
				candidates,
				subSchema.properties,
				node,
				outputId,
				nodeName,
				path,
				depth + 1,
			);
		}
		if (subSchema.type === "array" && subSchema.items.type === "object") {
			collectSubSchemaItems(
				candidates,
				subSchema.items.properties,
				node,
				outputId,
				nodeName,
				path,
				depth + 1,
			);
		}
	}
}

function isOutputSourceCandidate(node: NodeLike): boolean {
	if (!isOperationNode(node)) return false;
	if (isImageGenerationNode(node)) return false;
	if (node.content.type === "end") return false;
	if (node.content.type === "appEntry") return false;
	if (node.outputs.length === 0 && !getNodeSchema(node)) {
		return false;
	}
	return true;
}

function operationTypeToGroupLabel(type: string): string {
	switch (type) {
		case "textGeneration":
		case "contentGeneration":
			return "Text Generator";
		case "action":
			return "Action";
		case "trigger":
			return "Trigger";
		case "query":
		case "dataQuery":
			return "Query";
		default:
			return "Other";
	}
}

function useOutputSourceCandidates(nodes: NodeLike[]) {
	return useMemo(() => {
		const candidates = nodes
			.filter(isOutputSourceCandidate)
			.flatMap(collectCandidatesFromNode);

		const groups = new Map<string, SourceCandidateGroup>();
		for (const candidate of candidates) {
			const node = nodes.find((n) => n.id === candidate.source.nodeId);
			const contentType =
				node && isOperationNode(node) ? node.content.type : "other";
			const groupLabel = operationTypeToGroupLabel(contentType);
			const existing = groups.get(groupLabel);
			if (existing) {
				existing.items.push(candidate);
			} else {
				groups.set(groupLabel, {
					groupId: groupLabel,
					groupLabel,
					items: [candidate],
				});
			}
		}

		return [...groups.values()];
	}, [nodes]);
}

function filterGroups(
	groups: SourceCandidateGroup[],
	query: string,
): SourceCandidateGroup[] {
	const normalizedQuery = query.trim().toLowerCase();
	if (normalizedQuery === "") return groups;

	return groups
		.map((group) => ({
			...group,
			items: group.items.filter(
				(item) =>
					item.label.toLowerCase().includes(normalizedQuery) ||
					typeConfig[item.fieldType].label
						.toLowerCase()
						.includes(normalizedQuery),
			),
		}))
		.filter((group) => group.items.length > 0);
}

interface OutputSourcePickerProps {
	nodes: NodeLike[];
	value: PropertyMapping["source"] | undefined;
	onSelect: (ref: PropertyMapping["source"], fieldType: FieldType) => void;
	onClear: () => void;
}

export function OutputSourcePicker({
	nodes,
	value,
	onSelect,
	onClear,
}: OutputSourcePickerProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const groups = useOutputSourceCandidates(nodes);
	const filteredGroups = useMemo(
		() => filterGroups(groups, query),
		[groups, query],
	);
	const flatCandidates = useMemo(
		() => groups.flatMap((g) => g.items),
		[groups],
	);

	const selectedCandidate = useMemo(() => {
		if (!value) return undefined;
		return flatCandidates.find(
			(c) =>
				c.source.nodeId === value.nodeId &&
				c.source.outputId === value.outputId &&
				c.source.path.length === value.path.length &&
				c.source.path.every((seg, i) => seg === value.path[i]),
		);
	}, [value, flatCandidates]);

	const trigger = selectedCandidate ? (
		<div className="flex-1 min-w-0 flex items-center gap-[4px]">
			<button
				type="button"
				className="flex items-center gap-[8px] rounded-[6px] border border-border-muted bg-transparent px-[8px] py-[4px] min-w-0 flex-1 cursor-pointer hover:bg-white/5 transition-colors"
			>
				<span
					className={`shrink-0 ${typeConfig[selectedCandidate.fieldType].colorClass}`}
				>
					{typeConfig[selectedCandidate.fieldType].icon}
				</span>
				<span className="text-[12px] text-text truncate">
					{selectedCandidate.label}
				</span>
			</button>
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					onClear();
				}}
				className="shrink-0 p-[2px] text-white/30 hover:text-white/60 transition-colors cursor-pointer"
			>
				<X className="size-[12px]" />
			</button>
		</div>
	) : (
		<button
			type="button"
			className="w-full rounded-[8px] border border-border-muted bg-transparent px-[8px] py-[6px] text-[12px] text-white/40 hover:text-white/60 transition-colors text-left cursor-pointer"
		>
			Select source...
		</button>
	);

	return (
		<div className="flex-1 min-w-0">
			<PopoverPrimitive.Root
				open={open}
				onOpenChange={(o) => {
					setOpen(o);
					if (!o) setQuery("");
				}}
			>
				<PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
				<PopoverPrimitive.Portal>
					<PopoverPrimitive.Content
						sideOffset={4}
						align="start"
						className="z-50 w-[280px]"
						onOpenAutoFocus={(e) => e.preventDefault()}
					>
						<PopoverContent>
							<div className="flex h-[28px] p-[8px] items-center gap-[8px] rounded-[8px] bg-white/10 mx-[4px] mb-[4px]">
								<Search className="size-[14px] text-text-muted shrink-0" />
								<input
									placeholder="Search..."
									className="w-full bg-transparent border-none text-inverse text-[12px] placeholder:text-link-muted focus:outline-none"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
								/>
							</div>
							<div
								className="max-h-[240px] overflow-y-auto mx-[4px]"
								onWheel={(e) => e.stopPropagation()}
							>
								{filteredGroups.length === 0 ? (
									<p className="text-[12px] text-text-muted px-[8px] py-[6px]">
										No results found
									</p>
								) : (
									filteredGroups.map(({ groupId, groupLabel, items }) => (
										<div key={groupId}>
											<p className="text-text-muted px-[8px] py-[3px] text-[11px] font-medium mt-[4px]">
												{groupLabel}
											</p>
											{items.map(({ id, label, source, depth, fieldType }) => (
												<button
													key={id}
													type="button"
													className="flex items-center justify-between gap-[8px] w-full rounded-[4px] px-[8px] py-[6px] text-text hover:bg-ghost-element-hover cursor-pointer outline-none"
													style={
														depth > 0
															? {
																	paddingLeft: `${8 + depth * 16}px`,
																}
															: undefined
													}
													onClick={() => {
														onSelect(source, fieldType);
														setOpen(false);
														setQuery("");
													}}
												>
													<div className="flex items-center gap-[8px] min-w-0">
														<span
															className={`shrink-0 ${typeConfig[fieldType].colorClass}`}
														>
															{typeConfig[fieldType].icon}
														</span>
														<span className="text-[12px] truncate">
															{label}
														</span>
													</div>
													<span
														className={`text-[10px] font-bold tracking-wide shrink-0 ${typeConfig[fieldType].colorClass}`}
													>
														{typeConfig[fieldType].label}
													</span>
												</button>
											))}
										</div>
									))
								)}
							</div>
						</PopoverContent>
					</PopoverPrimitive.Content>
				</PopoverPrimitive.Portal>
			</PopoverPrimitive.Root>
		</div>
	);
}
