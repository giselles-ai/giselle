import clsx from "clsx/lite";
import type { ButtonHTMLAttributes, DetailedHTMLProps } from "react";

export function Button({
	className,
	...props
}: DetailedHTMLProps<
	ButtonHTMLAttributes<HTMLButtonElement>,
	HTMLButtonElement
>) {
	return (
		<button
			className={clsx(
				"px-[16px] h-[36px] rounded-full flex items-center gap-[2px] font-rosart text-black-30",
				className,
			)}
			style={{
				boxShadow: "0px 0px 3px 0px hsla(0, 0%, 100%, 0.4) inset",
			}}
			{...props}
		/>
	);
}
