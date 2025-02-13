import {
	Handle,
	type Node,
	type NodeProps,
	type NodeTypes,
	Position,
} from "@xyflow/react";
import { LetterTextIcon, SparkleIcon, TextIcon, ZapIcon } from "lucide-react";

type TextGenerationNode = Node<{ label: string }, "text-generation">;
type TriggerNode = Node<{ label: string }, "trigger">;
type TextNode = Node<{ label: string }, "text">;
type ResponseNode = Node<{ label: string }, "response">;

export type AppNode =
	| TextGenerationNode
	| TriggerNode
	| TextNode
	| ResponseNode;

export default function AppNode(nodeProps: NodeProps<AppNode>) {
	return (
		<div className="bg-rosepine-surface/80 rounded-sm min-w-[100px] grid gap-4 text-sm py-2">
			<div className="relative px-2 ">
				{nodeProps.type === "text-generation" && (
					<div className="flex items-center gap-1 text-rosepine-foam font-semibold">
						<div className="bg-rosepine-foam/20 rounded p-0.5">
							<div className="bg-rosepine-foam/50 rounded-lg p-0.5 text-rosepine-surface">
								<SparkleIcon size={16} strokeWidth={2} />
							</div>
						</div>
						<p>Text Generation</p>
						<Handle
							type="target"
							position={Position.Left}
							id="b"
							className="!absolute !w-[10px] !h-[10px] !top-[50%] !-translate-y-[50%] !-left-4 z-[1] !cursor-default !bg-rosepine-text"
						/>
						<Handle
							type="source"
							position={Position.Right}
							id="a"
							className="!absolute !w-[10px] !h-[10px] !top-[50%] !-translate-y-[50%] !left-[initial] !-right-4 z-[1] !cursor-default !bg-rosepine-text"
						/>
					</div>
				)}
				{nodeProps.type === "trigger" && (
					<div className="flex items-center gap-1 text-rosepine-rose font-semibold">
						<div className="bg-rosepine-rose/20 rounded p-0.5">
							<div className="bg-rosepine-rose/50 rounded-lg p-0.5 text-rosepine-surface">
								<ZapIcon size={16} strokeWidth={2} />
							</div>
						</div>
						<p>Trigger</p>

						<Handle
							type="source"
							position={Position.Right}
							id="a"
							className="!absolute !w-[10px] !h-[10px] !top-[50%] !-translate-y-[50%] !left-[initial] !-right-4 z-[1] !cursor-default !bg-rosepine-text"
						/>
					</div>
				)}
				{nodeProps.type === "text" && (
					<div className="flex items-center gap-1 text-rosepine-gold font-semibold">
						<div className="bg-rosepine-gold/20 rounded p-0.5">
							<div className="bg-rosepine-gold/50 rounded-lg p-0.5 text-rosepine-surface">
								<TextIcon size={16} strokeWidth={2} />
							</div>
						</div>
						<p>Text</p>
					</div>
				)}
				{nodeProps.type === "response" && (
					<div className="flex items-center gap-1 text-rosepine-iris font-semibold">
						<div className="bg-rosepine-iris/20 rounded p-0.5">
							<div className="bg-rosepine-iris/50 rounded-lg p-0.5 text-rosepine-surface">
								<SparkleIcon size={16} strokeWidth={2} />
							</div>
						</div>
						<p>Response</p>
						<Handle
							type="target"
							position={Position.Left}
							id="b"
							className="!absolute !w-[10px] !h-[10px] !top-[50%] !-translate-y-[50%] !-left-4 z-[1] !cursor-default !bg-rosepine-text"
						/>
					</div>
				)}
			</div>
			{nodeProps.type === "text-generation" && (
				<div className="flex gap-2 items-center text-sm">
					<div className="px-2 relative">
						<div className="py-0.5 text-rosepine-gold flex items-center gap-1">
							<div className="bg-rosepine-gold/40 rounded p-0.5">
								<LetterTextIcon size={12} />
							</div>
							<p>Instructions</p>
						</div>

						<Handle
							type="target"
							position={Position.Left}
							id="inst"
							className="!absolute !w-[10px] !h-[10px] !top-[50%] !-translate-y-[50%] !-left-4 z-[1] !cursor-default !bg-rosepine-gold"
						/>
					</div>

					<div className="px-2 relative">
						<div className="py-0.5 text-rosepine-gold flex items-center gap-1">
							<p>Result</p>
							<div className="bg-rosepine-gold/40 rounded p-0.5">
								<LetterTextIcon size={12} />
							</div>
						</div>

						<Handle
							type="source"
							position={Position.Right}
							id="tgr"
							className="!absolute !w-[10px] !h-[10px] !top-[50%] !-translate-y-[50%] !-right-4 z-[1] !cursor-default !bg-rosepine-gold"
						/>
					</div>
				</div>
			)}
			{nodeProps.type === "text" && (
				<div className="flex gap-2 items-center text-sm">
					<div className="w-[50px]" />
					<div className="px-2 relative">
						<div className="py-0.5 text-rosepine-gold flex items-center gap-1">
							<p>Text</p>
							<div className="bg-rosepine-gold/40 rounded p-0.5">
								<LetterTextIcon size={12} />
							</div>
						</div>

						<Handle
							type="source"
							position={Position.Right}
							id="text"
							className="!absolute !w-[10px] !h-[10px] !top-[50%] !-translate-y-[50%] !-right-4 z-[1] !cursor-default !bg-rosepine-gold"
						/>
					</div>
				</div>
			)}
			{nodeProps.type === "response" && (
				<div className="flex gap-2 items-center text-sm">
					<div className="px-2 relative">
						<div className="py-0.5 text-rosepine-gold flex items-center gap-1">
							<div className="bg-rosepine-gold/40 rounded p-0.5">
								<LetterTextIcon size={12} />
							</div>
							<p>Value</p>
						</div>

						<Handle
							type="target"
							position={Position.Left}
							id="val"
							className="!absolute !w-[10px] !h-[10px] !top-[50%] !-translate-y-[50%] !-left-4 z-[1] !cursor-default !bg-rosepine-gold"
						/>
					</div>
				</div>
			)}
		</div>
	);
}

export const nodeTypes = {
	"text-generation": AppNode,
	trigger: AppNode,
	text: AppNode,
	response: AppNode,
	// Add any of your custom nodes here!
} satisfies NodeTypes;
