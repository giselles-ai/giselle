import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type FC, useCallback, useRef } from "react";
import { useUpdateNode } from "../contexts/update-node";
import type { Node } from "../types";

type PropertyFieldProps = {
	name: string;
	label?: string;
	value: string;
	node: Node;
};
export const PropertyField: FC<PropertyFieldProps> = ({
	label,
	name,
	value,
	node,
}) => {
	const { updateNode } = useUpdateNode();
	const ref = useRef<HTMLTextAreaElement | null>(null);
	const handleBlur = useCallback(() => {
		if (ref.current == null) {
			return;
		}
		updateNode(node.id, {
			data: {
				...node.data,
				[name]: ref.current.value,
			},
		});
	}, [name, node, updateNode]);
	return (
		<div>
			<Label htmlFor={name}>{label ?? name}</Label>
			<Textarea
				name={name}
				id={name}
				defaultValue={value}
				ref={ref}
				onBlur={handleBlur}
			/>
		</div>
	);
};
