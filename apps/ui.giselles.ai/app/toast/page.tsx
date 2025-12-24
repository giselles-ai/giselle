"use client";

import { Button } from "@giselle-internal/ui/button";
import { ToastProvider, useToasts } from "@giselle-internal/ui/toast";
import { DemoSection } from "../components/demo-section";
import { UiPage } from "../components/ui-page";

function ToastDemo() {
	const toast = useToasts();

	return (
		<>
			<DemoSection label="Info Toast">
				<Button
					variant="filled"
					onClick={() => toast.info("This is an info message")}
				>
					Show Info Toast
				</Button>
			</DemoSection>

			<DemoSection label="Error Toast">
				<Button
					variant="filled"
					onClick={() => toast.error("This is an error message")}
				>
					Show Error Toast
				</Button>
			</DemoSection>

			<DemoSection label="Error Toast with Title">
				<Button
					variant="filled"
					onClick={() =>
						toast.error("Failed to upload file. Please try again.", {
							title: "Upload Failed",
						})
					}
				>
					Show Error Toast with Title
				</Button>
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

			<DemoSection label="Warning Toast">
				<Button
					variant="filled"
					onClick={() =>
						toast.toast("This is a warning message", {
							type: "warning",
						})
					}
				>
					Show Warning Toast
				</Button>
			</DemoSection>

			<DemoSection label="Warning Toast with Title">
				<Button
					variant="filled"
					onClick={() =>
						toast.toast("Please select an app before attaching files.", {
							type: "warning",
							title: "Select an app",
						})
					}
				>
					Show Warning Toast with Title
				</Button>
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
