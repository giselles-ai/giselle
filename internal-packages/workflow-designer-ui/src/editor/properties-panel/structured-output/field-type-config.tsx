import { Braces, Hash, List, ToggleLeft, Type } from "lucide-react";
import type { FieldType } from "./types";

export const typeConfig: Record<
	FieldType,
	{ label: string; icon: React.ReactNode; colorClass: string }
> = {
	string: {
		label: "STR",
		icon: <Type className="size-[14px]" />,
		colorClass: "text-emerald-300",
	},
	number: {
		label: "NUM",
		icon: <Hash className="size-[14px]" />,
		colorClass: "text-teal-300",
	},
	boolean: {
		label: "BOOL",
		icon: <ToggleLeft className="size-[14px]" />,
		colorClass: "text-rose-400",
	},
	enum: {
		label: "ENUM",
		icon: <List className="size-[14px]" />,
		colorClass: "text-purple-400",
	},
	object: {
		label: "OBJ",
		icon: <Braces className="size-[14px]" />,
		colorClass: "text-blue-300",
	},
	array: {
		label: "ARR",
		icon: <List className="size-[14px]" />,
		colorClass: "text-indigo-300",
	},
};
