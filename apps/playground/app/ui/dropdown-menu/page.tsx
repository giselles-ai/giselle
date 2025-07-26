"use client";

import { Button } from "@giselle-internal/ui/button";
import { DropdownMenu } from "@giselle-internal/ui/dropdown-menu";
import { FileText, HelpCircle, LogOut, Settings, User } from "lucide-react";
import { DemoSection } from "../components/demo-section";
import { UiPage } from "../components/ui-page";

export default function () {
	return (
		<UiPage title="Dropdown Menu">
			<DemoSection label="Basic Demo">
				<DropdownMenu
					items={[
						{ value: 1, label: "apple" },
						{ value: 2, label: "banana" },
						{ value: 3, label: "melon" },
					]}
					trigger={<Button>Basic Example</Button>}
				/>
			</DemoSection>
			<DemoSection label="Group Demo">
				<DropdownMenu
					items={[
						{
							groupId: "fruits",
							groupLabel: "Fruits",
							items: [
								{ value: 1, label: "Apple" },
								{ value: 2, label: "Banana" },
								{ value: 3, label: "Orange" },
							],
						},
						{
							groupId: "vegetables",
							groupLabel: "Vegetables",
							items: [
								{ value: 4, label: "Carrot" },
								{ value: 5, label: "Broccoli" },
								{ value: 6, label: "Spinach" },
							],
						},
						{
							groupId: "grains",
							groupLabel: "Grains",
							items: [
								{ value: 7, label: "Rice" },
								{ value: 8, label: "Wheat" },
								{ value: 9, label: "Oats" },
							],
						},
					]}
					trigger={<Button>Group Example</Button>}
					onSelect={(_event, option) => {
						console.log("Selected:", option);
					}}
				/>
			</DemoSection>
			<DemoSection label="Icon Demo">
				<DropdownMenu
					items={[
						{ value: 1, label: "Profile", icon: <User /> },
						{ value: 2, label: "Documents", icon: <FileText /> },
						{ value: 3, label: "Settings", icon: <Settings /> },
						{ value: 4, label: "Help", icon: <HelpCircle /> },
						{ value: 5, label: "Sign Out", icon: <LogOut /> },
					]}
					trigger={<Button>Icon Example</Button>}
				/>
			</DemoSection>
		</UiPage>
	);
}
