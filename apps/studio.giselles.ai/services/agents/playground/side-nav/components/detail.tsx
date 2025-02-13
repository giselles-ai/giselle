import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { usePlayground } from "../../context";
import { Layout } from "./layout";
import { SectionTitle } from "./section-title";

const agentNameModes = {
	show: "show",
	edit: "edit",
} as const;
type AgentNameMode = (typeof agentNameModes)[keyof typeof agentNameModes];

export const Detail: FC = () => {
	const { state, dispatch } = usePlayground();
	const [agentNameMode, setAgentNameMode] = useState<AgentNameMode>(
		agentNameModes.show,
	);
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (ref.current == null || agentNameMode !== agentNameModes.edit) {
			return;
		}
		ref.current.focus();
		ref.current.select();
	}, [agentNameMode]);
	const setAgentName = useCallback(() => {
		if (ref.current == null) {
			return;
		}
		dispatch({
			type: "SET_AGENT_NAME",
			agentName: ref.current.value,
		});
	}, [dispatch]);
	return (
		<Layout title="Detail">
			<div className="grid gap-[16px]">
				<SectionTitle title="Agent name" />
				{agentNameMode === agentNameModes.show && (
					<button
						className="text-black-30 text-[16px] font-[400] cursor-default text-left px-[8px] py-[4px]"
						type="button"
						onClick={() => {
							setAgentNameMode(agentNameModes.edit);
						}}
					>
						{state.agent.name ?? "Untitled"}
					</button>
				)}
				{agentNameMode === agentNameModes.edit && (
					<input
						className="px-[8px] py-[4px] border-[0.5px] border-black--50 rounded-[4px] focus-visible:ring-0"
						type="text"
						defaultValue={state.agent.name ?? "Untilted"}
						// value={state.agent.name}
						// onChange={(e) => {
						//   state.setAgentName(e.target.value);
						// }}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								setAgentName();
								setAgentNameMode(agentNameModes.show);
							}
						}}
						onBlur={() => {
							setAgentName();
							setAgentNameMode(agentNameModes.show);
						}}
						ref={ref}
					/>
				)}
			</div>
		</Layout>
	);
};
