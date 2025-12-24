"use client";

import { Button } from "@giselle-internal/ui/button";
import { ToastProvider, useToasts } from "@giselle-internal/ui/toast";
import { DemoSection } from "../components/demo-section";
import { UiPage } from "../components/ui-page";

function ToastDemo() {
	const toast = useToasts();

	return (
		<>
			<DemoSection label="Basic Toasts (Default)">
				<Button
					variant="filled"
					onClick={() => toast.info("This is a default toast message")}
				>
					Show Default Toast
				</Button>
			</DemoSection>

			<DemoSection label="All Toast Types">
				<div className="flex flex-wrap gap-2">
					<Button
						variant="filled"
						onClick={() =>
							toast.toast("Info toast", {
								type: "info",
							})
						}
					>
						Info
					</Button>
					<Button
						variant="filled"
						onClick={() =>
							toast.toast("Success toast", {
								type: "success",
							})
						}
					>
						Success
					</Button>
					<Button
						variant="filled"
						onClick={() =>
							toast.toast("Warning toast", {
								type: "warning",
							})
						}
					>
						Warning
					</Button>
					<Button
						variant="filled"
						onClick={() =>
							toast.toast("Error toast", {
								type: "error",
							})
						}
					>
						Error
					</Button>
					<Button
						variant="filled"
						onClick={() => {
							toast.toast("Info toast", { type: "info" });
							setTimeout(
								() => toast.toast("Success toast", { type: "success" }),
								200,
							);
							setTimeout(
								() => toast.toast("Warning toast", { type: "warning" }),
								400,
							);
							setTimeout(
								() => toast.toast("Error toast", { type: "error" }),
								600,
							);
						}}
					>
						Show All Types
					</Button>
				</div>
			</DemoSection>

			<DemoSection label="Toast with Title">
				<Button
					variant="filled"
					onClick={() =>
						toast.info("File uploaded successfully", {
							title: "Upload Complete",
						})
					}
				>
					Show Toast with Title
				</Button>
			</DemoSection>

			<DemoSection label="Toast with Action">
				<Button
					variant="filled"
					onClick={() =>
						toast.info("File uploaded successfully", {
							action: {
								label: "Undo",
								onClick: () => {
									console.log("Undo clicked");
								},
							},
						})
					}
				>
					Show Toast with Action
				</Button>
			</DemoSection>

			<DemoSection label="Toast with Title and Action">
				<Button
					variant="filled"
					onClick={() =>
						toast.info("File uploaded successfully", {
							title: "Upload Complete",
							action: {
								label: "Undo",
								onClick: () => {
									console.log("Undo clicked");
								},
							},
						})
					}
				>
					Show Toast with Title and Action
				</Button>
			</DemoSection>

			<DemoSection label="Toast with Title and Action (All Types)">
				<div className="flex flex-wrap gap-2">
					<Button
						variant="filled"
						onClick={() =>
							toast.toast("File uploaded successfully", {
								type: "info",
								title: "Upload Complete",
								action: {
									label: "Undo",
									onClick: () => {
										console.log("Undo clicked");
									},
								},
							})
						}
					>
						Info
					</Button>
					<Button
						variant="filled"
						onClick={() =>
							toast.toast("File uploaded successfully", {
								type: "success",
								title: "Upload Complete",
								action: {
									label: "Undo",
									onClick: () => {
										console.log("Undo clicked");
									},
								},
							})
						}
					>
						Success
					</Button>
					<Button
						variant="filled"
						onClick={() =>
							toast.toast("File uploaded successfully", {
								type: "warning",
								title: "Upload Complete",
								action: {
									label: "Undo",
									onClick: () => {
										console.log("Undo clicked");
									},
								},
							})
						}
					>
						Warning
					</Button>
					<Button
						variant="filled"
						onClick={() =>
							toast.toast("Failed to upload file", {
								type: "error",
								title: "Upload Failed",
								action: {
									label: "Retry",
									onClick: () => {
										console.log("Retry clicked");
									},
								},
							})
						}
					>
						Error
					</Button>
				</div>
			</DemoSection>

			<DemoSection label="Multiple Toasts">
				<Button
					variant="filled"
					onClick={() => {
						toast.info("First toast message");
						setTimeout(() => toast.info("Second toast message"), 500);
						setTimeout(() => toast.error("Third toast (error)"), 1000);
					}}
				>
					Show Multiple Toasts
				</Button>
			</DemoSection>
		</>
	);
}

export default function () {
	return (
		<ToastProvider>
			<UiPage title="Toast">
				<ToastDemo />
			</UiPage>
		</ToastProvider>
	);
}
