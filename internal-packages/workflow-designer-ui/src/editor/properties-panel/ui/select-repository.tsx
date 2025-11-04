import type { GitHubIntegrationInstalledState } from "@giselle-ai/giselle";
import { useIntegration } from "@giselle-ai/giselle/react";
import { Check, ChevronDown } from "lucide-react";
import {
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
	showMissingAccountLink = true,
	renderRepositories = true,
	onChangeInstallation,
}: Pick<
	GitHubIntegrationInstalledState,
	"installations" | "installationUrl"
> & {
	onSelectRepository: (value: SelectRepository) => void;
	showMissingAccountLink?: boolean;
	renderRepositories?: boolean;
	onChangeInstallation?: (installationId: number | null) => void;
}) {
	const [selectedInstallationId, setSelectedInstallationId] = useState<
		number | null
	>(null);
	const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
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

	// no fixed overlay; rely on relative absolute positioning

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
	return (
		<div className="w-full flex flex-col gap-[16px]">
			<fieldset className="flex flex-col gap-[8px]">
				<div className="relative" ref={dropdownRef}>
					<button
						type="button"
						onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
						className="w-full px-3 py-2 bg-inverse/5 hover:bg-inverse/10 rounded-[8px] text-inverse text-[14px] font-geist cursor-pointer text-left flex items-center justify-between"
					>
						<span
							className={
								selectedInstallationId ? "text-inverse" : "text-inverse/30"
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
						<ChevronDown className="h-4 w-4 text-inverse/60" />
					</button>
					{isOrgDropdownOpen && (
						<div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-[8px] bg-(image:--glass-bg) p-[4px] border border-glass-border/20 backdrop-blur-md shadow-xl after:absolute after:bg-(image:--glass-highlight-bg) after:left-4 after:right-4 after:h-px after:top-0">
							{installations.map((installation) => (
								<button
									key={installation.id}
									type="button"
									onClick={() => {
										setSelectedInstallationId(installation.id);
										setIsOrgDropdownOpen(false);
										onChangeInstallation?.(installation.id);
									}}
									className="flex w-full items-center rounded-md px-[8px] py-[6px] text-left font-sans text-[14px] leading-[16px] text-text hover:bg-ghost-element-hover"
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
				{showMissingAccountLink && (
					<p className="text-inverse text-[12px] text-right">
						Missing GitHub account?
						<button
							type="button"
							className="text-inverse hover:text-inverse ml-1 underline text-[12px]"
							onClick={handleClick}
						>
							Adjust GitHub App Permissions
						</button>
					</p>
				)}
			</fieldset>
			{renderRepositories && selectedInstallationId && repositories && (
				<div className="flex flex-col gap-[8px]">
					<p className="text-[14px] py-[1.5px] text-inverse">Repository</p>
					<div className="flex flex-col gap-y-[8px] relative">
						{isPending ? (
							<div className="flex items-center justify-center h-[64px] bg-bg-300/20 text-inverse text-[14px] rounded-[8px]">
								Loading...
							</div>
						) : (
							repositories.map((repo) => (
								<button
									key={repo.node_id}
									type="button"
									className="group relative rounded-[12px] overflow-hidden px-[16px] py-[12px] w-full border-[0.5px] border-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),inset_0_-1px_0_rgba(255,255,255,0.15)] hover:border-white/12 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(255,255,255,0.2)] transition-all duration-200 cursor-pointer text-left"
									onClick={() => {
										onSelectRepository({
											installationId: selectedInstallationId,
											owner: repo.owner.login,
											repo: repo.name,
											repoNodeId: repo.node_id,
										});
									}}
								>
									<div className="invisible group-hover:visible absolute right-4 top-1/2 transform -translate-y-1/2 bg-bg-800 text-inverse text-xs px-2 py-1 rounded whitespace-nowrap">
										Select
									</div>
									<div className="flex items-center justify-between">
										<div className="flex flex-col">
											<div className="flex items-center gap-2">
												<span className="text-inverse font-medium text-[14px]">
													{repo.name}
												</span>
												<span className="rounded-full px-1.5 py-px text-black-300 font-medium text-[10px] leading-normal font-geist border-[0.5px] border-black-400">
													{repo.private ? "Private" : "Public"}
												</span>
											</div>
										</div>
									</div>
								</button>
							))
						)}
					</div>
					<p className="text-inverse text-[12px] text-right">
						Missing Git repository?
						<button
							type="button"
							className="text-inverse hover:text-inverse ml-1 underline text-[12px]"
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
