import { Button } from "@/components/ui/button";
import { GitHubAppInstallButton } from "@/packages/components/github-app-install-button";
import type {
	GitHubNextAction,
	GitHubTriggerEvent,
} from "@/services/external/github/types";
import { LayersIcon } from "@giselles-ai/icons/layers";
import { WilliIcon } from "@giselles-ai/icons/willi";
import { SiGithub } from "@icons-pack/react-simple-icons";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as Tabs from "@radix-ui/react-tabs";
import { getDownloadUrl } from "@vercel/blob";
import clsx from "clsx/lite";
import {
	ArrowRightIcon,
	Check,
	ChevronDown,
	ChevronUp,
	DownloadIcon,
	FrameIcon,
	HammerIcon,
	ListTreeIcon,
	PlusIcon,
	TrashIcon,
	XIcon,
} from "lucide-react";
import {
	type ComponentProps,
	type ReactNode,
	createContext,
	useActionState,
	useContext,
	useMemo,
	useState,
} from "react";
import { useAgentName } from "../contexts/agent-name";
import { useDeveloperMode } from "../contexts/developer-mode";
import { useGitHubIntegration } from "../contexts/github-integration";
import { useGraph } from "../contexts/graph";
import type { GitHubEventNodeMapping, Node, NodeId, Step } from "../types";
import { Block } from "./block";
import { ContentTypeIcon } from "./content-type-icon";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

function SelectLabel({
	className,
	...props
}: ComponentProps<typeof SelectPrimitive.Label>) {
	return (
		<SelectPrimitive.Label
			className={clsx("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
			{...props}
		/>
	);
}
SelectLabel.displayName = SelectPrimitive.Label.displayName;
function SelectTrigger({
	className,
	children,
	...props
}: ComponentProps<typeof SelectPrimitive.Trigger>) {
	return (
		<SelectPrimitive.Trigger
			className={clsx(
				"flex h-10 w-full items-center justify-between rounded-md bg-[hsla(207,43%,91%,0.2)] px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
				className,
			)}
			{...props}
		>
			{children}
			<SelectPrimitive.Icon asChild>
				<ChevronDown className="h-4 w-4 opacity-50" />
			</SelectPrimitive.Icon>
		</SelectPrimitive.Trigger>
	);
}
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

function SelectScrollUpButton({
	className,
	...props
}: ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
	return (
		<SelectPrimitive.ScrollUpButton
			className={clsx(
				"flex cursor-default items-center justify-center py-1",
				className,
			)}
			{...props}
		>
			<ChevronUp className="h-4 w-4" />
		</SelectPrimitive.ScrollUpButton>
	);
}

function SelectScrollDownButton({
	className,
	...props
}: ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
	return (
		<SelectPrimitive.ScrollDownButton
			className={clsx(
				"flex cursor-default items-center justify-center py-1",
				className,
			)}
			{...props}
		>
			<ChevronDown className="h-4 w-4" />
		</SelectPrimitive.ScrollDownButton>
	);
}
SelectScrollDownButton.displayName =
	SelectPrimitive.ScrollDownButton.displayName;

function SelectContent({
	className,
	children,
	position = "popper",
	...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
	return (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Content
				className={clsx(
					"relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-[hsla(222,21%,40%,1)] bg-black-100 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
					position === "popper" &&
						"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
					className,
				)}
				position={position}
				{...props}
			>
				<SelectScrollUpButton />
				<SelectPrimitive.Viewport
					className={clsx(
						"p-1",
						position === "popper" &&
							"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
					)}
				>
					{children}
				</SelectPrimitive.Viewport>
				<SelectScrollDownButton />
			</SelectPrimitive.Content>
		</SelectPrimitive.Portal>
	);
}
SelectContent.displayName = SelectPrimitive.Content.displayName;

function SelectItem({
	children,
	description,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Item> & {
	description?: string;
}) {
	return (
		<SelectPrimitive.Item
			className={clsx(
				"relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
			)}
			{...props}
		>
			<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
				<SelectPrimitive.ItemIndicator>
					<Check className="h-4 w-4" />
				</SelectPrimitive.ItemIndicator>
			</span>

			<div>
				<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
				{description && (
					<div className="text-black-30 text-[12px]">{description}</div>
				)}
			</div>
		</SelectPrimitive.Item>
	);
}
SelectItem.displayName = SelectPrimitive.Item.displayName;

interface SelectOption {
	value: string;
	label: string;
	description?: string;
}
interface SelectGroup {
	label: string;
	options: SelectOption[];
}
type SelectProps = ComponentProps<typeof SelectPrimitive.Root> &
	Pick<ComponentProps<typeof SelectPrimitive.Value>, "placeholder"> & {
		options: SelectOption[] | SelectGroup[];
	};
function isSelectGroup(item: SelectOption | SelectGroup): item is SelectGroup {
	return "options" in item;
}
function Select({
	defaultValue,
	value,
	onValueChange,
	defaultOpen,
	open,
	onOpenChange,
	dir,
	name,
	disabled,
	required,
	placeholder,
	options,
}: SelectProps) {
	return (
		<SelectPrimitive.Root
			defaultValue={defaultValue}
			value={value}
			onValueChange={onValueChange}
			defaultOpen={defaultOpen}
			open={open}
			onOpenChange={onOpenChange}
			dir={dir}
			name={name}
			disabled={disabled}
			required={required}
		>
			<SelectTrigger>
				<SelectPrimitive.Value placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				{options.map((item) => {
					if (isSelectGroup(item)) {
						return (
							<SelectPrimitive.Group key={item.label}>
								<SelectLabel>{item.label}</SelectLabel>
								{item.options.map((option) => (
									<SelectItem
										key={option.value}
										value={option.value}
										description={option.description}
									>
										{option.label}
									</SelectItem>
								))}
							</SelectPrimitive.Group>
						);
					}
					return (
						<SelectItem
							key={item.value}
							value={item.value}
							description={(item as SelectOption).description}
						>
							{item.label}
						</SelectItem>
					);
				})}
			</SelectContent>
		</SelectPrimitive.Root>
	);
}

function Popover({
	defaultOpen,
	open,
	onOpenChange,
	modal,
	className,
	trigger,
	...popoverContentProps
}: Omit<ComponentProps<typeof PopoverPrimitive.Root>, "children"> &
	ComponentProps<typeof PopoverPrimitive.PopoverContent> & {
		trigger: ReactNode;
	}) {
	return (
		<PopoverPrimitive.Root
			open={open}
			onOpenChange={onOpenChange}
			defaultOpen={defaultOpen}
			modal={modal}
		>
			<PopoverPrimitive.Trigger className="">
				{trigger}
			</PopoverPrimitive.Trigger>
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Content
					className={clsx(
						"rounded-[24px] bg-[hsla(234,91%,5%,0.8)] overflow-hidden shadow-[0px_0px_3px_0px_hsla(0,_0%,_100%,_0.25)_inset] backdrop-blur-[16px] px-[18px] py-[18px]",
						className,
					)}
					{...popoverContentProps}
				/>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
}

function TabsTrigger(
	props: Omit<ComponentProps<typeof Tabs.Trigger>, "className">,
) {
	return (
		<Tabs.Trigger
			className="w-[40px] h-[40px] flex items-center justify-center rounded-full hover:bg-[hsla(30,100%,98%,0.2)] data-[state=active]:bg-black-80"
			{...props}
		/>
	);
}

function TabsContent(
	props: Omit<ComponentProps<typeof Tabs.Content>, "className">,
) {
	return (
		<Tabs.Content
			className="absolute w-[340px] rounded-[24px] bg-[hsla(234,91%,5%,0.8)] overflow-hidden shadow-[0px_0px_3px_0px_hsla(0,_0%,_100%,_0.25)_inset] top-[0px] bottom-[20px] left-[84px] mt-[60px] backdrop-blur-[16px]"
			{...props}
		/>
	);
}

interface TabValueContextState {
	tabValue: string;
	setTabValue: (value: string) => void;
	popoverOpen: boolean;
	setPopoverOpen: (value: boolean) => void;
	subPopoverOpen: boolean;
	setSubPopoverOpen: (value: boolean) => void;
}
const TabValueContext = createContext<TabValueContextState | undefined>(
	undefined,
);

export const useTabValue = () => {
	const context = useContext(TabValueContext);
	if (!context) {
		throw new Error("useTabValue must be used within a TabValueProvider");
	}
	return context;
};

export function NavigationPanel() {
	const [tabValue, setTabValue] = useState("");
	const [popoverOpen, setPopoverOpen] = useState(false);
	const [subPopoverOpen, setSubPopoverOpen] = useState(false);
	const developerMode = useDeveloperMode();
	return (
		<TabValueContext
			value={{
				tabValue,
				setTabValue,
				popoverOpen,
				setPopoverOpen,
				subPopoverOpen,
				setSubPopoverOpen,
			}}
		>
			<Tabs.Root
				orientation="vertical"
				value={tabValue}
				onValueChange={(value) => setTabValue(value)}
			>
				<Tabs.List className="absolute w-[54px] rounded-full bg-[hsla(233,93%,5%,0.8)] px-[4px] py-[8px] overflow-hidden shadow-[0px_0px_3px_0px_hsla(0,_0%,_100%,_0.25)_inset] top-[0px] left-[20px] mt-[60px] grid justify-center gap-[4px]">
					<TabsTrigger value="overview">
						<LayersIcon className="w-[18px] h-[18px] fill-black-30" />
					</TabsTrigger>
					<TabsTrigger value="github">
						<SiGithub className="w-[18px] h-[18px] stroke-black-30" />
					</TabsTrigger>
					<TabsTrigger value="structure">
						<ListTreeIcon className="w-[18px] h-[18px] stroke-black-30" />
					</TabsTrigger>

					{developerMode && (
						<TabsTrigger value="developer">
							<HammerIcon className="w-[18px] h-[18px] stroke-black-30" />
						</TabsTrigger>
					)}
				</Tabs.List>
				<TabsContent value="overview">
					<Overview />
				</TabsContent>
				<TabsContent value="github">
					<GitHubIntegration />
				</TabsContent>
				<TabsContent value="structure">
					<Structure />
				</TabsContent>
				<TabsContent value="developer">
					<Developer />
				</TabsContent>
			</Tabs.Root>
		</TabValueContext>
	);
}

function ContentPanel({ children }: { children: ReactNode }) {
	return (
		<div className="flex flex-col gap-[24px] px-[24px] py-[24px] h-full overflow-y-hidden">
			{children}
		</div>
	);
}
function ContentPanelHeader({
	children,
}: {
	children: ReactNode;
}) {
	const { setTabValue } = useTabValue();
	return (
		<header className="flex justify-between">
			<p
				className="text-[22px] font-rosart text-black--30"
				style={{ textShadow: "0px 0px 20px hsla(207, 100%, 48%, 1)" }}
			>
				{children}
			</p>
			<button type="button" onClick={() => setTabValue("")}>
				<XIcon className="w-[16px] h-[16px] text-black-30" />
			</button>
		</header>
	);
}

export function ContentPanelSectionHeader({
	title,
	action,
}: { title: string; action?: ReactNode }) {
	return (
		<div className="flex items-center">
			<span className="shrink text-black-30 text-[16px] font-rosart font-[500]">
				{title}
			</span>
			<div className="ml-[16px] grow border-t border-black-80" />
			{action}
		</div>
	);
}

export function ContentPanelSection(props: { children: ReactNode }) {
	return <div className="grid gap-[8px]">{props.children}</div>;
}

export function ContentPanelSectionFormField(props: { children: ReactNode }) {
	return <div className="grid gap-[2px]">{props.children}</div>;
}

const fallbackAgentName = "Untitled Agent";
export function Overview() {
	const [editTitle, setEditTitle] = useState(false);
	const { agentName, updateAgentName } = useAgentName();
	return (
		<ContentPanel>
			<ContentPanelHeader>Overview</ContentPanelHeader>

			{editTitle ? (
				<input
					type="text"
					className="text-[16px] text-black-30 p-[4px] text-left outline-black-70 rounded-[8px]"
					defaultValue={agentName ?? fallbackAgentName}
					ref={(ref) => {
						if (ref === null) {
							return;
						}
						async function update() {
							if (ref === null) {
								return;
							}
							setEditTitle(false);
							await updateAgentName(ref.value);
						}
						ref.focus();
						ref.select();
						ref.addEventListener("blur-sm", update);
						ref.addEventListener("keydown", (e) => {
							if (e.key === "Enter") {
								update();
							}
						});
						return () => {
							ref.removeEventListener("blur-sm", update);
							ref.removeEventListener("keydown", update);
						};
					}}
				/>
			) : (
				<button
					type="button"
					onClick={() => setEditTitle(true)}
					className="text-[16px] text-black-30 p-[4px] text-left"
				>
					{agentName ?? fallbackAgentName}
				</button>
			)}
		</ContentPanel>
	);
}

function GitHubEventNodeMappingForm({
	nodes,
	onCommit,
}: {
	nodes: Node[];
	onCommit?: (githubEventNodeMapping: GitHubEventNodeMapping) => void;
}) {
	return (
		<>
			<p className="font-rosart">Data mapping</p>
			<form
				className="space-y-[12px]"
				onSubmit={(event) => {
					event.preventDefault();
					const formData = new FormData(event.currentTarget);
					const source = formData.get("source") as string;
					const target = formData.get("nodeId") as NodeId;
					onCommit?.({ event: source, nodeId: target });
				}}
			>
				<div className="flex items-stretch gap-[14px]">
					<div>
						<Label>Issue comment data</Label>
						<Select
							name="source"
							placeholder="Select data"
							options={[
								{
									label: "comment",
									options: [
										{
											value: "comment.body",
											label: "coment.body",
											description: "The body of the issue comment",
										},
									],
								},
								{
									label: "issue",
									options: [
										{
											value: "issue.title",
											label: "issue.title",
											description: "The title of the issue",
										},
										{
											value: "issue.body",
											label: "issue.body",
											description: "The body of the issue",
										},
									],
								},
							]}
						/>
					</div>
					<div>
						<Label>Node</Label>
						<Select
							name="nodeId"
							placeholder="Select node"
							options={nodes.map((node) => ({
								value: node.id,
								label: node.name,
							}))}
						/>
					</div>
				</div>
				<div>
					<Button type="submit">Add new data</Button>
				</div>
			</form>
		</>
	);
}

function GitHubIntegration() {
	const { status } = useGitHubIntegration();
	const content = () => {
		switch (status) {
			case "unauthorized":
				return <RequireGitHubAuthorization />;
			case "invalid-credential":
				return <RequireGitHubReAuthorization />;
			case "installed":
			case "not-installed":
				return <GitHubIntegrationForm />;
			default:
				throw new Error(status satisfies never);
		}
	};
	return (
		<ContentPanel>
			<ContentPanelHeader>GitHub Integration</ContentPanelHeader>
			{content()}
		</ContentPanel>
	);
}

function RequireGitHubAuthorization() {
	const { connectGitHubIdentityAction } = useGitHubIntegration();

	return (
		<div className="grid gap-[16px] text-center">
			<WilliIcon className="w-8 h-8 fill-slate-600 mx-auto" />
			<div className="text-sm text-gray-600">
				You are not signed in. Please log in with GitHub using the button below
				to get started and explore the world of Giselle.
			</div>
			<GitHubConnectionButton action={connectGitHubIdentityAction} />
		</div>
	);
}

function RequireGitHubReAuthorization() {
	const { reconnectGitHubIdentityAction } = useGitHubIntegration();

	return (
		<div className="grid gap-[16px] text-center">
			<WilliIcon className="w-8 h-8 fill-slate-600 mx-auto" />
			<div className="text-sm text-gray-600">
				Your GitHub access token has expired or become invalid. Please reconnect
				to continue using the service.
			</div>
			<GitHubConnectionButton action={reconnectGitHubIdentityAction} />
		</div>
	);
}

function GitHubConnectionButton({ action }: { action: () => Promise<void> }) {
	const [_, formAction, isPending] = useActionState(async () => {
		await action();
	}, null);

	return (
		<form action={formAction}>
			<Button
				variant="link"
				className="flex items-center gap-2 w-full justify-center text-blue-200 border-blue-200"
				type="submit"
				disabled={isPending}
			>
				<SiGithub className="h-[20px] w-[20px] text-white" />
				Continue with GitHub
			</Button>
		</form>
	);
}

const integrationEventList = [
	{
		type: "github.issue_comment.created" satisfies GitHubTriggerEvent,
		label: "Comment on Issue",
	},
] as const;
const nextActionList = [
	{
		type: "github.issue_comment.reply" satisfies GitHubNextAction,
		label: "Comment on trigger issue",
	},
] as const;
function GitHubIntegrationForm() {
	const integration = useGitHubIntegration();
	const { installUrl, setting, upsertGitHubIntegrationSettingAction } =
		integration;
	const repositories =
		integration.status === "installed" ? integration.repositories : [];
	const { popoverOpen, setPopoverOpen } = useTabValue();
	const { graph } = useGraph();
	const [repositoryFullName, setRepositoryFullName] = useState(
		setting?.repositoryFullName ?? "",
	);
	const [callSign, setCallSign] = useState(setting?.callSign ?? "");
	const [eventNodeMappings, setEventNodeMappings] = useState<
		GitHubEventNodeMapping[]
	>(setting?.eventNodeMappings ?? []);

	const processedMappings = useMemo(
		() =>
			eventNodeMappings
				.map((eventNodeMapping) => {
					const node = graph.nodes.find(
						(node) => node.id === eventNodeMapping.nodeId,
					);
					if (node === undefined) {
						return null;
					}
					return {
						...eventNodeMapping,
						id: `${eventNodeMapping.event}-${eventNodeMapping.nodeId}`,
						node,
					};
				})
				.filter((eventNodeMapping) => eventNodeMapping !== null),
		[eventNodeMappings, graph.nodes],
	);
	const [upsertGitHubIntegrationSettingActionResult, action, upserting] =
		useActionState(upsertGitHubIntegrationSettingAction, null);
	return (
		<form
			className="grid gap-[16px] overflow-y-auto mx-[-20px] px-[20px]"
			action={action}
		>
			{upsertGitHubIntegrationSettingActionResult?.result === "error" && (
				<p>{upsertGitHubIntegrationSettingActionResult.message}</p>
			)}
			<ContentPanelSection>
				<GitHubAppInstallButton
					installationUrl={installUrl}
					installed={integration.status === "installed"}
				/>
				<ContentPanelSectionHeader title="Repository" />
				<Select
					name="repositoryFullName"
					placeholder="Choose repository"
					options={repositories.map((repository) => ({
						value: repository.full_name,
						label: repository.full_name,
					}))}
					defaultValue={setting?.repositoryFullName}
					onValueChange={(value) => {
						setRepositoryFullName(value);
					}}
				/>
			</ContentPanelSection>
			<ContentPanelSection>
				<ContentPanelSectionHeader title="Trigger" />
				<ContentPanelSectionFormField>
					<Label htmlFor="event">Event</Label>
					<Select
						name="event"
						defaultValue={setting?.event}
						placeholder="Choose event"
						options={integrationEventList.map((integrationEvent) => ({
							value: integrationEvent.type,
							label: integrationEvent.label,
						}))}
					/>

					<ContentPanelSectionFormField>
						<Label htmlFor="callSign">Call sign</Label>
						<Input
							type="text"
							name="callSign"
							id="callSign"
							placeholder="Enter call sign"
							className="w-full"
							value={callSign}
							onChange={(e) => setCallSign(e.target.value)}
						/>
						<span className="text-black-70 text-[12px]">
							You can call this agent by commenting{" "}
							<span className="py-[0px] px-[4px] text-black--30 bg-black-70 rounded-[2px]">
								/giselle {callSign === "" ? "[call sign]" : callSign}
							</span>{" "}
							{repositoryFullName === ""
								? "in the issue"
								: `in the issue in ${repositoryFullName}`}
						</span>
					</ContentPanelSectionFormField>
				</ContentPanelSectionFormField>
			</ContentPanelSection>
			<ContentPanelSection>
				<ContentPanelSectionHeader title="Action" />
				<ContentPanelSectionFormField>
					<Label>Run flow</Label>
					<Select
						name="flowId"
						placeholder="Choose next action"
						options={graph.flows.map((flow) => ({
							value: flow.id,
							label: flow.name,
						}))}
						defaultValue={setting?.flowId}
					/>
				</ContentPanelSectionFormField>
			</ContentPanelSection>
			<ContentPanelSection>
				<ContentPanelSectionHeader
					title="Data mapping"
					action={
						<Popover
							open={popoverOpen}
							onOpenChange={setPopoverOpen}
							side="right"
							sideOffset={18}
							align="end"
							trigger={
								<PlusIcon className="text-[12px] text-black-30 stroke-1 ml-[4px]" />
							}
							onOpenAutoFocus={(event) => {
								event.preventDefault();
							}}
							onCloseAutoFocus={(event) => {
								event.preventDefault();
							}}
							onInteractOutside={(event) => {
								event.preventDefault();
							}}
						>
							<GitHubEventNodeMappingForm
								nodes={graph.nodes}
								onCommit={(assignData) => {
									setEventNodeMappings((prev) => [...prev, assignData]);
									setPopoverOpen(false);
								}}
							/>
						</Popover>
					}
				/>

				{processedMappings.length > 0 && (
					<div className="space-y-[12px] overflow-x-hidden">
						{processedMappings.map((mapping, index) => (
							<Block
								className="flex items-center gap-[12px] font-rosart"
								key={mapping.id}
							>
								<div className="leading-tight flex-1">
									<p className="text-[12px] text-black-50">Source</p>
									<p>{mapping.event}</p>
								</div>
								<ArrowRightIcon className="w-[16px] h-[16px] text-black-30" />
								<div className="flex flex-1 overflow-x-hidden">
									<div className="leading-tight truncate">
										<p className="text-[12px] text-black-50">Target</p>
										<p className="text-[14px] truncate">{mapping.node.name}</p>
									</div>
									<button
										type="button"
										className="hidden group-hover:block px-[6px]"
										onClick={() => {
											setEventNodeMappings((prev) =>
												prev.filter(
													(p) =>
														p.nodeId !== mapping.nodeId ||
														p.event !== mapping.event,
												),
											);
										}}
									>
										<TrashIcon className="w-[18px] h-[18px]" />
									</button>
								</div>
							</Block>
						))}
						<input
							type="hidden"
							name="githubEventNodeMappings"
							defaultValue={JSON.stringify(eventNodeMappings)}
						/>
					</div>
				)}
			</ContentPanelSection>
			<ContentPanelSection>
				<ContentPanelSectionHeader title="Then" />
				<ContentPanelSectionFormField>
					<Select
						name="nextAction"
						defaultValue={setting?.nextAction}
						placeholder="Choose next action"
						options={nextActionList.map((nextAction) => ({
							value: nextAction.type,
							label: nextAction.label,
						}))}
					/>
				</ContentPanelSectionFormField>
			</ContentPanelSection>
			{setting?.id && <input type="hidden" name="id" value={setting.id} />}
			<Button type="submit" data-loading={upserting} disabled={upserting}>
				Save
			</Button>
		</form>
	);
}

function Developer() {
	const { graphUrl } = useGraph();
	return (
		<ContentPanel>
			<ContentPanelHeader>Developer tools</ContentPanelHeader>
			<div className="flex flex-col gap-[8px]">
				<div>
					<a
						href={getDownloadUrl(graphUrl)}
						className="text-black-30 hover:text-black--30 flex items-center gap-[6px]"
					>
						<DownloadIcon className="w-[16px] h-[16px]" />
						Download the graph
					</a>
				</div>
			</div>
		</ContentPanel>
	);
}

function StructureNodeItem({
	node,
	className,
}: { node: Node; className?: string }) {
	return (
		<div
			className={clsx(
				"hover:bg-white/10 flex items-center gap-[14px] px-[4px] py-[1px] cursor-default",
				className,
			)}
		>
			<ContentTypeIcon
				contentType={node.content.type}
				className="w-[16px] h-[16px] fill-current"
			/>
			<p>{node.name}</p>
		</div>
	);
}

function StructureStepItem({
	step,
	stepClassName,
	variableNodesClassName,
}: {
	step: Step & { node: Node; variableNodes: Node[] };
	stepClassName?: string;
	variableNodesClassName?: string;
}) {
	return (
		<div>
			<StructureNodeItem node={step.node} className={stepClassName} />
			{step.variableNodes.map((node) => (
				<StructureNodeItem
					key={node.id}
					node={node}
					className={variableNodesClassName}
				/>
			))}
		</div>
	);
}
export function Structure() {
	const { graph } = useGraph();
	const flows = useMemo(
		() =>
			graph.flows.map((flow) => ({
				...flow,
				jobs: flow.jobs.map((job) => ({
					...job,
					steps: job.steps
						.map((step) => {
							const node = graph.nodes.find((node) => node.id === step.nodeId);
							const variableNodes = step.variableNodeIds
								.map((nodeId) => graph.nodes.find((node) => node.id === nodeId))
								.filter((node) => node !== undefined);
							if (node === undefined) {
								return null;
							}
							return {
								...step,
								node,
								variableNodes,
							};
						})
						.filter((step) => step !== null),
				})),
			})),
		[graph],
	);
	return (
		<ContentPanel>
			<ContentPanelHeader>Structure</ContentPanelHeader>
			<div className="flex flex-col gap-[8px]">
				{flows.map((flow) => (
					<div key={flow.id}>
						<div className="flex items-center gap-[14px] hover:bg-white/10 px-[4px] py-[1px] rounded-[2px]">
							<WilliIcon className="w-[16px] h-[16px] fill-current" />
							<p className="text-[14px]">{flow.name}</p>
						</div>
						<div className="pt-[4px] flex flex-col gap-[4px] text-[14px]">
							{flow.jobs.map((job) => (
								<div key={job.id}>
									{job.steps.length === 1 ? (
										<StructureStepItem
											step={job.steps[0]}
											stepClassName="pl-[34px]"
											variableNodesClassName="pl-[64px]"
										/>
									) : (
										<div>
											<div className="pl-[34px] hover:bg-white/10 px-[4px] py-[1px] gap-[14px] flex items-center">
												<FrameIcon className="w-[16px] h-[16px] fill-current" />
												<p>Subflow</p>
											</div>

											{job.steps.map((step) => (
												<StructureStepItem
													step={step}
													key={step.id}
													stepClassName="pl-[64px]"
													variableNodesClassName="pl-[94px]"
												/>
											))}
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</ContentPanel>
	);
}
