import { Select } from "@giselle-internal/ui/select";
import { FileText, HelpCircle, LogOut, Settings, User } from "lucide-react";
import { DemoSection } from "../components/demo-section";
import { UiPage } from "../components/ui-page";

export default function () {
	return (
		<UiPage title="Select">
			<DemoSection label="Demo">
				<Select
					name="repositoryNodeId"
					options={[
						{ value: 1, label: "apple" },
						{ value: 2, label: "banana" },
						{ value: 3, label: "melon" },
						{ value: 4, label: "long long long option" },
					]}
					placeholder="Select apple..."
				/>
			</DemoSection>
			<DemoSection label="Icon Demo">
				<Select
					name="iconSelect"
					options={[
						{ value: 1, icon: <FileText />, label: "Documents" },
						{ value: 2, icon: <Settings />, label: "Settings" },
						{ value: 3, icon: <User />, label: "Profile" },
						{ value: 4, icon: <HelpCircle />, label: "Help" },
						{ value: 5, icon: <LogOut />, label: "Sign out" },
					]}
					placeholder="Select an option..."
				/>
			</DemoSection>
		</UiPage>
	);
}
