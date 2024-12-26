"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import clsx from "clsx/lite";
import type { ComponentProps } from "react";

export function Label({
	className,
	...props
}: ComponentProps<typeof LabelPrimitive.Root>) {
	return (
		<LabelPrimitive.Root
			className={clsx(
				"text-[12px] text-black-70 font-[500] leading-[20.4px] peer-disabled:cursor-not-allowed",
			)}
			{...props}
		/>
	);
}
Label.displayName = LabelPrimitive.Root.displayName;
