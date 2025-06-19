import type { GitHubIntegrationInstalledState } from "@giselle-sdk/integration";
import { useIntegration } from "@giselle-sdk/integration/react";
import {
	type FormEventHandler,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../ui/select";

interface SelectRepository {
	installationId: number;
	owner: string;
	repo: string;
	repoNodeId: string;
}
export function SelectRepository({
	installations,
	installationUrl,
	onSelectRepository,
}: Pick<
	GitHubIntegrationInstalledState,
	"installations" | "installationUrl"
> & {
	onSelectRepository: (value: SelectRepository) => void;
}) {
	const [installationId, setInstalltionId] = useState<string>(
		`${installations[0].id}`,
	);
	const repositories = useMemo(() => {
		if (installationId === undefined) {
			return undefined;
		}
		const installation = installations.find(
			(installation) => installation.id === Number.parseInt(installationId),
		);
		if (installation === undefined) {
			return undefined;
		}
		return installation.repositories;
	}, [installationId, installations]);

	const { refresh } = useIntegration();
	const [isPending, startTransition] = useTransition();
	const popupRef = useRef<Window | null>(null);

	// Handler for installation message from popup window
	const handleInstallationMessage = useCallback(
		(event: MessageEvent) => {
			if (event.data?.type === "github-app-installed") {
				startTransition(() => {
					refresh();
				});
			}
		},
		[refresh],
	);

	// Listen for visibility changes to refresh data when user returns to the page
	useEffect(() => {
		// Add event listener for installation message from popup
		window.addEventListener("message", handleInstallationMessage);

		return () => {
			window.removeEventListener("message", handleInstallationMessage);

			// Close popup if component unmounts
			if (popupRef.current && !popupRef.current.closed) {
				popupRef.current.close();
			}
		};
	}, [handleInstallationMessage]);

	const handleClick = useCallback(() => {
		const width = 800;
		const height = 800;
		const left = window.screenX + (window.outerWidth - width) / 2;
		const top = window.screenY + (window.outerHeight - height) / 2;

		popupRef.current = window.open(
			installationUrl,
			"Configure GitHub App",
			`width=${width},height=${height},top=${top},left=${left},popup=1`,
		);

		if (!popupRef.current) {
			console.warn("Failed to open popup window");
			return;
		}
	}, [installationUrl]);
	const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
		(e) => {
			e.preventDefault();
			const formData = new FormData(e?.currentTarget);
			const installationId = formData.get("installationId");
			const owner = formData.get("owner");
			const repo = formData.get("repo");
			const repoNodeId = formData.get("repoNodeId");
			if (
				typeof installationId !== "string" ||
				typeof owner !== "string" ||
				typeof repo !== "string" ||
				typeof repoNodeId !== "string"
			) {
				throw new Error(
					"Invalid form data: 'installationId', 'owner', 'repo', and 'repoNodeId' must all be strings.",
				);
			}

			onSelectRepository({
				installationId: Number.parseInt(installationId),
				owner,
				repo,
				repoNodeId,
			});
		},
		[onSelectRepository],
	);
	return (
		<div className="w-full flex flex-col gap-[16px]">
			<fieldset className="flex flex-col gap-[8px]">
				<Select
					name="repositoryNodeId"
					value={installationId}
					onValueChange={(value) => setInstalltionId(value)}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select a repository" />
					</SelectTrigger>
					<SelectContent>
						{installations.map((installation) => (
							<SelectItem key={installation.id} value={`${installation.id}`}>
								{installation.account &&
									"login" in installation.account &&
									installation.account.login}
								{installation.account &&
									"slug" in installation.account &&
									installation.account.slug}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<p className="text-black-400 text-[14px]">
					Missing GitHub account?
					<button
						type="button"
						className="text-blue-900 px-[4px] cursor-pointer hover:underline"
						onClick={handleClick}
					>
						Adjust GitHub App Permissions →
					</button>
				</p>
			</fieldset>
			{installationId && repositories && (
				<div className="flex flex-col gap-[8px]">
					<ul className="flex flex-col border rounded-[8px] divide-y">
						{isPending ? (
							<li className="flex items-center justify-center h-[64px]">
								Loading...
							</li>
						) : (
							repositories.map((repo) => (
								<li
									key={repo.node_id}
									className="px-[12px] py-[12px] flex items-center justify-between"
								>
									{repo.name}
									<form onSubmit={handleSubmit}>
										<input
											type="hidden"
											name="installationId"
											value={installationId}
										/>
										<input
											type="hidden"
											name="owner"
											value={repo.owner.login}
										/>
										<input type="hidden" name="repo" value={repo.name} />
										<input
											type="hidden"
											name="repoNodeId"
											value={repo.node_id}
										/>
										<button
											type="submit"
											className="rounded-[4px] px-[12px] h-[30px] bg-white-900 text-black-900 cursor-pointer"
										>
											Set Up
										</button>
									</form>
								</li>
							))
						)}
					</ul>
					<p className="text-black-400 text-[14px]">
						Missing Git repository?
						<button
							type="button"
							className="text-blue-900 px-[4px] cursor-pointer hover:underline"
							onClick={handleClick}
						>
							Adjust GitHub App Permissions →
						</button>
					</p>
				</div>
			)}
		</div>
	);
}
