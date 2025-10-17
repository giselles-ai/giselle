import clsx from "clsx";

type NodeInputLabelProps = {
	label: string;
	isConnected: boolean;
	isRequired?: boolean;
};

export function NodeInputLabel({
	label,
	isConnected,
	isRequired,
}: NodeInputLabelProps) {
	return (
		<div
			className={clsx(
				"px-[12px] text-[12px]",
				isConnected
					? "px-[16px] text-inverse"
					: "absolute left-[-12px] whitespace-nowrap -translate-x-[100%] text-black-400",
				isConnected && isRequired && "text-red-900",
			)}
		>
			{label}
		</div>
	);
}
