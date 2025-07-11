import type { GitHubIntegrationInstalledState } from "@giselle-sdk/giselle-engine";
import { useIntegration } from "@giselle-sdk/giselle-engine/react";
import { Check, ChevronDown } from "lucide-react";
import {
	type FormEventHandler,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";

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
	onSelectRepository: (
		value: SelectRepository,
		setLoading: (loading: boolean) => void,
	) => void;
}) {
	const [selectedInstallationId, setSelectedInstallationId] = useState<
		number | null
	>(null);
	const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const repositories = useMemo(() => {
		if (selectedInstallationId === null) {
			return undefined;
		}
		const installation = installations.find(
			(installation) => installation.id === selectedInstallationId,
		);
		if (installation === undefined) {
			return undefined;
		}
		return installation.repositories;
	}, [selectedInstallationId, installations]);

	const { refresh } = useIntegration();
	const [isPending, startTransition] = useTransition();
	const popupRef = useRef<Window | null>(null);

	// Handle click outside to close dropdown
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOrgDropdownOpen(false);
			}
		};

		if (isOrgDropdownOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOrgDropdownOpen]);

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
	const _handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
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

			onSelectRepository(
				{
					installationId: Number.parseInt(installationId),
					owner,
					repo,
					repoNodeId,
				},
				setIsLoading,
			);
		},
		[onSelectRepository],
	);
	return (
		<div className="w-full flex flex-col gap-[16px]">
			<fieldset className="flex flex-col gap-[8px]">
				<div className="relative" ref={dropdownRef}>
					<button
						type="button"
						onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
						className="w-full px-3 py-2 bg-black-300/20 rounded-[8px] text-white-400 text-[14px] font-geist cursor-pointer text-left flex items-center justify-between"
					>
						<span
							className={
								selectedInstallationId ? "text-[#F7F9FD]" : "text-white/30"
							}
						>
							{!selectedInstallationId
								? "Select an Organization"
								: (() => {
										const installation = installations.find(
											(i) => i.id === selectedInstallationId,
										);
										if (!installation?.account) return "Select an Organization";
										return "login" in installation.account
											? installation.account.login
											: "slug" in installation.account
												? installation.account.slug
												: "Select an Organization";
									})()}
						</span>
						<ChevronDown className="h-4 w-4 text-white/60" />
					</button>
					{isOrgDropdownOpen && (
						<div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-[8px] border-[0.25px] border-white/10 bg-black-850 p-1 shadow-none">
							{installations.map((installation) => (
								<button
									key={installation.id}
									type="button"
									onClick={() => {
										setSelectedInstallationId(installation.id);
										setIsOrgDropdownOpen(false);
									}}
									className="flex w-full items-center rounded-md px-3 py-2 text-left font-sans text-[14px] leading-[16px] text-[#F7F9FD] hover:bg-white/5"
								>
									<span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
										{selectedInstallationId === installation.id && (
											<Check className="h-4 w-4" />
										)}
									</span>
									{installation.account &&
										("login" in installation.account
											? installation.account.login
											: "slug" in installation.account
												? installation.account.slug
												: "")}
								</button>
							))}
						</div>
					)}
				</div>
				<p className="text-white-500 text-[14px] text-right">
					Missing GitHub account?
					<button
						type="button"
						className="text-white-400 hover:text-white-300 ml-1 underline text-[14px]"
						onClick={handleClick}
					>
						Adjust GitHub App Permissions
					</button>
				</p>
			</fieldset>
			{selectedInstallationId && repositories && (
				<div className="flex flex-col gap-[8px]">
					<p className="text-[14px] py-[1.5px] text-[#F7F9FD]">Repository</p>
					<div className="flex flex-col gap-y-[8px] relative">
						{isLoading && (
							<div className="absolute inset-0 z-10 flex items-center justify-center bg-black-900/50 backdrop-blur-sm rounded-[8px]">
								<div className="text-white-400 text-[14px]">Setting up...</div>
							</div>
						)}
						{isPending ? (
							<div className="flex items-center justify-center h-[64px] bg-black-300/20 text-white-400 text-[14px] rounded-[8px]">
								Loading...
							</div>
						) : (
							repositories.map((repo) => (
								<button
									key={repo.node_id}
									type="button"
									className="group relative rounded-[12px] overflow-hidden px-[16px] py-[12px] w-full bg-white/[0.02] backdrop-blur-[8px] border-[0.5px] border-white/8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.2)] hover:border-white/12 transition-colors duration-200 cursor-pointer text-left"
									onClick={() => {
										onSelectRepository(
											{
												installationId: selectedInstallationId,
												owner: repo.owner.login,
												repo: repo.name,
												repoNodeId: repo.node_id,
											},
											setIsLoading,
										);
									}}
								>
									<div className="invisible group-hover:visible absolute right-4 top-1/2 transform -translate-y-1/2 bg-black-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
										Select
									</div>
									<div className="flex items-center justify-between">
										<div className="flex flex-col">
											<div className="flex items-center gap-2">
												<span className="text-white-400 font-medium text-[14px]">
													{repo.name}
												</span>
												<span className="rounded-full px-1.5 py-px text-black-300 font-medium text-[10px] leading-normal font-geist border-[0.5px] border-black-400">
													{repo.private ? "Private" : "Public"}
												</span>
											</div>
										</div>
										{isLoading && (
											<div className="text-white-400 text-[14px]">
												Setting up...
											</div>
										)}
									</div>
								</button>
							))
						)}
					</div>
					<p className="text-white-500 text-[14px] text-right">
						Missing Git repository?
						<button
							type="button"
							className="text-white-400 hover:text-white-300 ml-1 underline text-[14px]"
							onClick={handleClick}
						>
							Adjust GitHub App Permissions
						</button>
					</p>
				</div>
			)}
		</div>
	);
}
