import clsx from "clsx";
import { CheckIcon, ChevronDownIcon, CopyIcon, XIcon } from "lucide-react";
import { Dialog, DropdownMenu } from "radix-ui";
import { useState } from "react";

type SharePermission = "edit" | "view";
type AccessScope = "team" | "anyone";

export function ShareModal({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [permission, setPermission] = useState<SharePermission>("view");
	const [accessScope, setAccessScope] = useState<AccessScope>("team");
	const [copied, setCopied] = useState(false);

	// This function would call an API to get a token in a real implementation
	const generateShareUrl = () => {
		// Dummy URL - in real implementation this would fetch a JWT token from backend
		return "http://localhost:3000/playground/wrks-WdQ7...";
	};

	const handleCopy = async () => {
		const url = generateShareUrl();
		await navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const getScopeDescription = () => {
		if (accessScope === "team") {
			return "Only team members and invited guests can access this app.";
		}
		return "Anyone with the URL can access this app, not just team members or individually invited users.";
	};

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black-900/20 backdrop-blur-[2px] data-[state=open]:animate-overlayShow z-50" />
				<Dialog.Content
					className={clsx(
						"fixed left-1/2 top-1/2 max-w-[520px] w-[90vw] -translate-x-1/2 -translate-y-1/2 z-50",
						"rounded-[16px] bg-[#0C0F1F] px-[32px] pt-[32px] pb-[16px] border border-[#1C2033] shadow-xl focus:outline-none",
						"transform transition-all duration-300 ease-out data-[state=open]:animate-contentShow",
					)}
				>
					<div className="flex items-center justify-between mb-6">
						<Dialog.Title
							style={{
								color: "var(--primary100, #B8E8F4)",
								textShadow: "0px 0px 10px #0087F6",
								fontFamily: '"Hubot Sans"',
								fontSize: "24px",
								fontStyle: "normal",
								fontWeight: 600,
								lineHeight: "140%",
							}}
						>
							Share this App
						</Dialog.Title>
						<div className="flex items-center gap-4">
							<button
								onClick={handleCopy}
								type="button"
								style={{
									color: "var(--primary100, #B8E8F4)",
									fontFamily: '"Hubot Sans"',
									fontSize: "14px",
									fontStyle: "normal",
									fontWeight: 700,
									lineHeight: "140%",
									textDecorationLine: "underline",
									textDecorationStyle: "solid",
									textDecorationSkipInk: "none",
									textDecorationThickness: "auto",
									textUnderlineOffset: "auto",
									textUnderlinePosition: "from-font",
								}}
							>
								Copy link
							</button>
							<Dialog.Close asChild>
								<button
									className="rounded-full h-8 w-8 inline-flex items-center justify-center text-white-400 hover:text-white-900 focus:outline-none transition-colors"
									aria-label="Close"
									type="button"
								>
									<XIcon size={18} />
								</button>
							</Dialog.Close>
						</div>
					</div>

					<p className="text-[15px] text-white-400 mb-8">
						Create a link to share this app with others. Choose the access
						level:
					</p>

					<div className="mb-5">
						<h3
							style={{
								color: "var(--white-850, #F5F5F5)",
								fontFamily: "Geist",
								fontSize: "12px",
								fontStyle: "normal",
								fontWeight: 500,
								lineHeight: "170%",
							}}
							className="mb-3"
						>
							Access authorizations
						</h3>

						<div className="relative mb-2">
							<DropdownMenu.Root>
								<DropdownMenu.Trigger asChild>
									<button
										style={{
											display: "flex",
											height: "36px",
											padding: "8px 16px",
											justifyContent: "space-between",
											alignItems: "center",
											alignSelf: "stretch",
											borderRadius: "8px",
											border: "1px solid var(--white-900, #F7F9FD)",
											boxShadow:
												"0px 0px 4px 0px rgba(255, 255, 255, 0.20) inset",
										}}
										className="w-full"
										type="button"
									>
										<span
											style={{
												color: "var(--white-900, #F7F9FD)",
												fontFamily: '"Hubot Sans"',
												fontSize: "14px",
												fontStyle: "normal",
												fontWeight: 500,
												lineHeight: "140%",
											}}
										>
											{accessScope === "team"
												? "Only people in your team"
												: "Anyone"}
										</span>
										<ChevronDownIcon
											size={18}
											style={{ color: "var(--white-900, #F7F9FD)" }}
										/>
									</button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content
									className="bg-[#06071A] border border-[#1C2033] rounded-lg shadow-lg p-0 z-50"
									align="start"
									sideOffset={4}
									style={{ width: "454px" }}
								>
									<DropdownMenu.Item
										className={`flex items-center px-4 py-3 ${accessScope === "team" ? "bg-[#101438]" : "hover:bg-[#101438]"} cursor-pointer`}
										onClick={() => setAccessScope("team")}
									>
										<div className="flex items-center w-full">
											{accessScope === "team" && (
												<CheckIcon size={16} className="text-white-900 mr-2" />
											)}
											<span
												className={`${accessScope === "team" ? "" : "pl-6"} text-white-900 font-medium text-[14px]`}
											>
												Only people in your team
											</span>
										</div>
									</DropdownMenu.Item>
									<DropdownMenu.Item
										className={`flex items-center px-4 py-3 ${accessScope === "anyone" ? "bg-[#101438]" : "hover:bg-[#101438]"} cursor-pointer`}
										onClick={() => setAccessScope("anyone")}
									>
										<div className="flex items-center w-full">
											{accessScope === "anyone" && (
												<CheckIcon size={16} className="text-white-900 mr-2" />
											)}
											<span
												className={`${accessScope === "anyone" ? "" : "pl-6"} text-white-900 font-medium text-[14px]`}
											>
												Anyone
											</span>
										</div>
									</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</div>

						<p className="text-[14px] text-[#5C6484] mb-6">
							{getScopeDescription()}
						</p>
					</div>

					{accessScope === "anyone" && (
						<>
							<h3
								style={{
									color: "var(--white-850, #F5F5F5)",
									fontFamily: "Geist",
									fontSize: "12px",
									fontStyle: "normal",
									fontWeight: 500,
									lineHeight: "170%",
								}}
								className="mb-3"
							>
								What can they do:
							</h3>

							<div className="grid grid-cols-2 gap-4 mb-6">
								<button
									className={clsx(
										"rounded-lg p-3 cursor-pointer",
										permission === "view"
											? "bg-[#10121E] border border-primary-100"
											: "bg-[#0A0C1A] border border-[#1C2033]",
									)}
									onClick={() => setPermission("view")}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											setPermission("view");
										}
									}}
									type="button"
								>
									<div className="flex items-start mb-2">
										<div
											className={clsx(
												"w-4 h-4 rounded-full border flex items-center justify-center mr-2 mt-0.5",
												permission === "view"
													? "border-primary-100"
													: "border-[#3A3F59]",
											)}
										>
											{permission === "view" && (
												<div className="w-2 h-2 rounded-full bg-primary-100" />
											)}
										</div>
										<div>
											<div className="text-white-900 text-[14px] font-medium">
												Viewer access
											</div>
										</div>
									</div>
									<p className="text-[#5C6484] text-[13px] ml-6">
										Collaborators can only preview the app
									</p>
								</button>

								<button
									className={clsx(
										"rounded-lg p-3 cursor-pointer",
										permission === "edit"
											? "bg-[#10121E] border border-primary-100"
											: "bg-[#0A0C1A] border border-[#1C2033]",
									)}
									onClick={() => setPermission("edit")}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											setPermission("edit");
										}
									}}
									type="button"
								>
									<div className="flex items-start mb-2">
										<div
											className={clsx(
												"w-4 h-4 rounded-full border flex items-center justify-center mr-2 mt-0.5",
												permission === "edit"
													? "border-primary-100"
													: "border-[#3A3F59]",
											)}
										>
											{permission === "edit" && (
												<div className="w-2 h-2 rounded-full bg-primary-100" />
											)}
										</div>
										<div>
											<div className="text-white-900 text-[14px] font-medium">
												Editor access
											</div>
										</div>
									</div>
									<p className="text-[#5C6484] text-[13px] ml-6">
										Only people in your team can access
									</p>
								</button>
							</div>
						</>
					)}

					{accessScope === "team" && (
						<>
							<h3
								style={{
									color: "var(--white-850, #F5F5F5)",
									fontFamily: "Geist",
									fontSize: "12px",
									fontStyle: "normal",
									fontWeight: 500,
									lineHeight: "170%",
								}}
								className="mb-3"
							>
								Who can access
							</h3>

							<div
								style={{
									display: "flex",
									padding: "8px",
									justifyContent: "space-between",
									alignItems: "center",
									alignSelf: "stretch",
									borderRadius: "8px",
									background: "var(--white-850-10, rgba(245, 245, 245, 0.10))",
								}}
								className="mb-4"
							>
								<div className="flex items-center">
									<div className="w-6 h-6 bg-gray-300 rounded-full mr-3" />
									<span
										style={{
											color: "var(--white-850, #F5F5F5)",
											fontFamily: "Geist",
											fontSize: "14px",
											fontStyle: "normal",
											fontWeight: 500,
											lineHeight: "170%",
										}}
									>
										Your team
									</span>
								</div>
								<div className="flex items-center">
									<span className="text-[#5C6484] mr-2">edit</span>
									<ChevronDownIcon size={16} className="text-[#5C6484]" />
								</div>
							</div>

							<div
								style={{
									display: "flex",
									padding: "8px",
									justifyContent: "space-between",
									alignItems: "center",
									alignSelf: "stretch",
									borderRadius: "8px",
									background: "var(--white-850-10, rgba(245, 245, 245, 0.10))",
								}}
								className="mb-6"
							>
								<div className="flex items-center">
									<div className="w-6 h-6 bg-gray-300 rounded-full mr-3" />
									<span
										style={{
											color: "var(--white-850, #F5F5F5)",
											fontFamily: "Geist",
											fontSize: "14px",
											fontStyle: "normal",
											fontWeight: 500,
											lineHeight: "170%",
										}}
									>
										kaori.nakashima@route06.co.jp
									</span>
								</div>
								<div className="flex items-center">
									<span className="text-[#5C6484] mr-2">view</span>
									<ChevronDownIcon size={16} className="text-[#5C6484]" />
								</div>
							</div>
						</>
					)}

					<div
						style={{
							display: "flex",
							padding: "8px 12px",
							justifyContent: "space-between",
							alignItems: "center",
							gap: "10px",
							alignSelf: "stretch",
							borderRadius: "8px",
							background: "var(--black-400, #293354)",
						}}
						className="mb-4"
					>
						<input
							type="text"
							value={generateShareUrl()}
							readOnly
							style={{
								display: "block",
								flex: "1 0 0",
								overflow: "hidden",
								color: "#FFF",
								textOverflow: "ellipsis",
								fontFamily: "Geist",
								fontSize: "14px",
								fontStyle: "normal",
								fontWeight: 500,
								lineHeight: "normal",
								whiteSpace: "nowrap",
								minWidth: 0,
							}}
							className="bg-transparent border-none outline-none"
						/>
						<div className="flex flex-col items-center">
							<button
								onClick={handleCopy}
								className={`${copied ? "text-green-500" : "text-white-900"} p-1.5 rounded hover:bg-[#151A3A] transition-colors flex-shrink-0`}
								type="button"
							>
								{copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
							</button>
						</div>
					</div>

					<div className="text-center h-6 -mt-2 transition-opacity">
						{copied && (
							<span className="text-[#39FF7F] text-[12px] font-medium">
								Copied to clipboard!
							</span>
						)}
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
