import { settingsV2Flag } from "@/flags";
import type { ReactNode } from "react";
import SettingsLayoutV1 from "./settings-layout-v1";
import SettingsLayoutV2 from "./settings-layout-v2";

export default async function SettingsLayout({
	children,
}: { children: ReactNode }) {
	const isV2 = await settingsV2Flag();

	if (isV2) {
		return <SettingsLayoutV2>{children}</SettingsLayoutV2>;
	}
	return <SettingsLayoutV1>{children}</SettingsLayoutV1>;
}
