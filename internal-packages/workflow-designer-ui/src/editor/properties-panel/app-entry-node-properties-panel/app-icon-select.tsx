"use client";

import { Select, type SelectOption } from "@giselle-internal/ui/select";
import {
	Box,
	Cable,
	Code,
	Cpu,
	Globe,
	Grid,
	Layers,
	Wand,
	Zap,
} from "lucide-react";

const appIconOptions: SelectOption[] = [
	{ value: "cable", label: "Cable", icon: <Cable /> },
	{ value: "box", label: "Box", icon: <Box /> },
	{ value: "cpu", label: "CPU", icon: <Cpu /> },
	{ value: "layers", label: "Layers", icon: <Layers /> },
	{ value: "zap", label: "Zap", icon: <Zap /> },
	{ value: "globe", label: "Globe", icon: <Globe /> },
	{ value: "code", label: "Code", icon: <Code /> },
	{ value: "wand", label: "Wand", icon: <Wand /> },
	{ value: "grid", label: "Grid", icon: <Grid /> },
];

export function AppIconSelect({
	value,
	onValueChange,
}: {
	value?: string;
	onValueChange?: (value: string) => void;
}) {
	return (
		<Select
			options={appIconOptions}
			placeholder=""
			value={value}
			onValueChange={onValueChange}
			renderOption={() => null}
			widthClassName="size-fit"
		/>
	);
}
