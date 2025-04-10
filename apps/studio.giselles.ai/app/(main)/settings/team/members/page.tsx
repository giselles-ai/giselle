import { TeamMembers } from "../team-members";

export default async function TeamMembersPage() {
	return (
		<div className="flex flex-col gap-[24px]">
			<h3
				className="text-primary-100 font-semibold text-[28px] leading-[28px] tracking-[-0.011em] font-hubot"
				style={{ textShadow: "0px 0px 20px hsla(207, 100%, 48%, 1)" }}
			>
				Members
			</h3>
			<TeamMembers />
		</div>
	);
}
