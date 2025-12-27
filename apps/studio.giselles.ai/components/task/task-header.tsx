import { StatusBadge } from "@giselle-internal/ui/status-badge";
import type {
	GenerationContextInput,
	ParameterItem,
	Task,
	UploadedFileData,
	WorkspaceId,
} from "@giselles-ai/protocol";
import { Check, FilePenLineIcon } from "lucide-react";
import Link from "next/link";
import { TaskInputString } from "./task-input-string";

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function getNestedValue(value: unknown, path: string[]): unknown {
	let current: unknown = value;
	for (const key of path) {
		if (!isRecord(current)) {
			return undefined;
		}
		current = current[key];
	}
	return current;
}

function getNestedString(value: unknown, path: string[]): string | undefined {
	const nestedValue = getNestedValue(value, path);
	return typeof nestedValue === "string" ? nestedValue : undefined;
}

function tryConvertGitHubApiPullRequestUrlToHtmlUrl(
	apiUrl: string,
): string | undefined {
	const match =
		/^https:\/\/api\.github\.com\/repos\/([^/]+)\/([^/]+)\/pulls\/(\d+)$/.exec(
			apiUrl,
		);
	if (match == null) {
		return undefined;
	}
	const [, owner, repo, number] = match;
	return `https://github.com/${owner}/${repo}/pull/${number}`;
}

function getGitHubPullRequestHtmlUrlFromWebhookEvent(webhookEvent: {
	name: string;
	data: unknown;
}): string | undefined {
	const data = webhookEvent.data;

	const direct = getNestedString(data, ["pull_request", "html_url"]);
	if (direct != null) {
		return direct;
	}

	const fromCheckSuite = getNestedString(data, [
		"check_suite",
		"pull_requests",
		"0",
		"html_url",
	]);
	if (fromCheckSuite != null) {
		return fromCheckSuite;
	}

	const fromIssuePullRequest = getNestedString(data, [
		"issue",
		"pull_request",
		"html_url",
	]);
	if (fromIssuePullRequest != null) {
		return fromIssuePullRequest;
	}

	const apiUrlCandidates = [
		getNestedString(data, ["pull_request", "url"]),
		getNestedString(data, ["check_suite", "pull_requests", "0", "url"]),
		getNestedString(data, ["issue", "pull_request", "url"]),
	].filter((url): url is string => url != null);

	for (const apiUrl of apiUrlCandidates) {
		const converted = tryConvertGitHubApiPullRequestUrlToHtmlUrl(apiUrl);
		if (converted != null) {
			return converted;
		}
	}

	return undefined;
}

function formatJsonPreview(value: unknown, maxLines: number): string {
	try {
		const json = JSON.stringify(value, null, 2) ?? "";
		const lines = json.split("\n");
		if (lines.length <= maxLines) {
			return json;
		}
		return `${lines.slice(0, maxLines).join("\n")}\n… (truncated, showing first ${maxLines} lines of ${lines.length})`;
	} catch {
		return "[unserializable payload]";
	}
}

function formatFileSize(bytes?: number) {
	const safeBytes = Number.isFinite(bytes) ? (bytes as number) : 0;
	if (safeBytes <= 0) {
		return "0 B";
	}
	const units = ["B", "KB", "MB", "GB", "TB"];
	const exponent = Math.min(
		Math.floor(Math.log(safeBytes) / Math.log(1024)),
		units.length - 1,
	);
	const value = safeBytes / 1024 ** exponent;
	const decimals = value >= 10 || exponent === 0 ? 0 : 1;
	return `${value.toFixed(decimals)} ${units[exponent]}`;
}

function TaskInputGitHubWebhookEvent({
	webhookEvent,
}: {
	webhookEvent: { name: string; data: unknown };
}) {
	const eventName = webhookEvent.name;
	const action = getNestedString(webhookEvent.data, ["action"]);
	const repoFullName = getNestedString(webhookEvent.data, [
		"repository",
		"full_name",
	]);
	const senderLogin = getNestedString(webhookEvent.data, ["sender", "login"]);
	const prUrl = getGitHubPullRequestHtmlUrlFromWebhookEvent(webhookEvent);

	return (
		<div className="mt-2">
			<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-text/80">
				<span className="font-medium text-inverse">GitHub webhook</span>
				<span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px]">
					{eventName}
				</span>
				{action != null ? (
					<span className="text-text-muted">action: {action}</span>
				) : null}
				{repoFullName != null ? (
					<span className="text-text-muted">repo: {repoFullName}</span>
				) : null}
				{senderLogin != null ? (
					<span className="text-text-muted">sender: {senderLogin}</span>
				) : null}
			</div>

			{prUrl != null ? (
				<div className="mt-2">
					<a
						href={prUrl}
						target="_blank"
						rel="noreferrer"
						className="text-[12px] text-[hsl(192,73%,84%)] hover:underline"
					>
						Open related Pull Request
					</a>
				</div>
			) : null}

			<details className="mt-3">
				<summary className="cursor-pointer select-none text-[12px] text-text-muted hover:text-inverse">
					Payload (truncated)
				</summary>
				<pre className="mt-2 max-h-64 overflow-auto rounded-md border border-white/10 bg-black/30 p-2 text-[11px] text-text/80">
					{formatJsonPreview(webhookEvent.data, 120)}
				</pre>
			</details>
		</div>
	);
}

function TaskInputItemFile({ file }: { file: UploadedFileData }) {
	const sizeLabel = formatFileSize(file.size);

	return (
		<div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-left">
			<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
				<Check className="h-4 w-4 text-emerald-300" aria-hidden />
			</div>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<p className="truncate text-[13px] text-white">{file.name}</p>
				<p className="text-[11px] text-blue-muted/70">{sizeLabel} · Ready</p>
			</div>
		</div>
	);
}

function TaskInputItem({ item }: { item: ParameterItem }) {
	switch (item.type) {
		case "files":
			if (item.value.length === 0) {
				return null;
			}
			return (
				<div className="mt-3 space-y-2" aria-live="polite">
					<div className="flex items-center justify-between px-1 text-[11px] text-blue-muted/70">
						<span>{item.name || "Attachments"}</span>
						<span>
							{item.value.length}/{item.value.length} ready
						</span>
					</div>
					{item.value.map((file) => (
						<TaskInputItemFile key={file.id} file={file} />
					))}
				</div>
			);
		case "number":
			return <p>{item.value}</p>;
		case "string":
			return <TaskInputString value={item.value} />;
		default: {
		}
	}
}

interface TaskHeaderProps {
	status: Task["status"];
	title: string;
	description: string;
	workspaceId: WorkspaceId;
	input: GenerationContextInput | null;
}

export function TaskHeader({
	status,
	title,
	description,
	workspaceId,
	input,
}: TaskHeaderProps) {
	return (
		<div className="w-full pb-3  bg-[color:var(--color-background)]">
			{/* Top gradient separator to soften the edge against the header */}
			<div className="h-4 bg-gradient-to-b from-[color:var(--color-background)] to-transparent pointer-events-none" />
			<div className="mx-auto pt-2">
				{/* App Summary Section */}
				<div>
					{/* Task Status */}
					<div className="mb-2">
						{status === "created" ? (
							<StatusBadge status="success">Completed</StatusBadge>
						) : status === "inProgress" ? (
							<StatusBadge status="info">In Progress</StatusBadge>
						) : status === "completed" ? (
							<StatusBadge status="success">Completed</StatusBadge>
						) : status === "failed" ? (
							<StatusBadge status="error">Failed</StatusBadge>
						) : (
							<StatusBadge status="ignored">Cancelled</StatusBadge>
						)}
					</div>
					{/* Title */}
					<div className="flex items-start justify-between gap-3 mb-1 w-full">
						<h3 className="text-[20px] font-normal text-inverse min-w-0 break-words whitespace-normal">
							{title}
						</h3>
						<Link
							href={`/workspaces/${workspaceId}`}
							className="inline-block shrink-0 whitespace-nowrap"
							target="_blank"
							rel="noreferrer"
						>
							<div className="group [&>div]:rounded-lg [&>div>div]:rounded-md [&>div>div]:text-[hsl(192,73%,84%)] [&>div>div]:border-[hsl(192,73%,84%)] [&>div>div]:transition-colors [&>div>div]:cursor-pointer hover:[&>div>div]:bg-[hsl(192,73%,84%)] hover:[&>div>div]:text-[hsl(192,73%,20%)]">
								<StatusBadge
									status="warning"
									variant="default"
									leftIcon={
										<FilePenLineIcon className="stroke-[hsl(192,73%,84%)] stroke-[1.5] transition-colors group-hover:stroke-[hsl(192,73%,20%)]" />
									}
								>
									Edit in Workspace
								</StatusBadge>
							</div>
						</Link>
					</div>
					{/* App summary heading + text (2-column layout to reduce height) */}
					{description.length > 0 && (
						<div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3 w-full">
							<span className="text-text-muted text-[13px] font-semibold shrink-0">
								App summary:
							</span>
							<p className="text-[14px] font-normal text-inverse leading-relaxed">
								{description}
							</p>
						</div>
					)}
				</div>

				{/* Task input preview */}
				<div className="mt-3">
					<div className="rounded-[10px] border border-blue-muted/40 bg-blue-muted/7 px-3 py-2 text-[13px] text-text/80">
						{input == null ? (
							<p>No task input</p>
						) : input.type === "parameters" ? (
							input.items.map((item) => (
								<TaskInputItem key={item.name} item={item} />
							))
						) : input.type === "github-webhook-event" ? (
							<TaskInputGitHubWebhookEvent webhookEvent={input.webhookEvent} />
						) : (
							<p>No task input</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
