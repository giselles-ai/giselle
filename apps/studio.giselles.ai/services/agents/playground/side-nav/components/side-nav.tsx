"use client";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { BookOpenIcon, LayersIcon, XIcon } from "lucide-react";
import { type FC, useState } from "react";
import type { JSX } from "react/jsx-runtime";
import { match } from "ts-pattern";
import { usePlayground } from "../../context";
import { useSideNav } from "../context";
import { SideNavProvider } from "../provider";
import { sideNavs } from "../types";
import { Detail } from "./detail";
import { KnowledgeList } from "./knowledge/knowledge-list";

type NavItemProps = {
	icon: JSX.Element;
	tooltip: string;
	onClick: () => void;
};
const NavItem: FC<NavItemProps> = ({ icon, tooltip, onClick }) => {
	return (
		<TooltipProvider delayDuration={0}>
			<Tooltip>
				<TooltipTrigger className="flex justify-center" onClick={onClick}>
					{icon}
				</TooltipTrigger>
				<TooltipContent side="right">
					<p>{tooltip}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

const SideNavInner: FC = () => {
	const { state: sideNavState, dispatch: dispatchSideNavAction } = useSideNav();
	const { state } = usePlayground();
	return (
		<div className="relative">
			<div className="bg-black-100 h-full px-2 pt-8 w-[60px] border-r border-black-80">
				<div className="flex flex-col gap-4">
					<NavItem
						icon={<LayersIcon />}
						tooltip="Detail"
						onClick={() => {
							dispatchSideNavAction({
								type: "OPEN",
								active: sideNavs.detail,
							});
						}}
					/>
					<NavItem
						icon={<BookOpenIcon />}
						tooltip="Knowledges"
						onClick={() => {
							dispatchSideNavAction({
								type: "OPEN",
								active: sideNavs.knowledges,
							});
						}}
					/>
				</div>
			</div>
			<LazyMotion features={domAnimation}>
				<AnimatePresence>
					{sideNavState.open && (
						<m.div
							className="bg-black-100 h-full pt-8 absolute top-0 right-0 translate-x-[100%] z-10 overflow-x-hidden border-r border-black-80"
							initial={{ width: 0 }}
							animate={{ width: "300px" }}
							exit={{ width: 0 }}
						>
							<div className="w-[300px]">
								{match(sideNavState.active)
									.with(sideNavs.detail, () => <Detail />)
									.with(sideNavs.knowledges, () => (
										<KnowledgeList knowledges={state.knowledges} />
									))
									.otherwise(() => null)}
							</div>
						</m.div>
					)}
				</AnimatePresence>
			</LazyMotion>
		</div>
	);
};

export const SideNav = () => (
	<SideNavProvider>
		<SideNavInner />
	</SideNavProvider>
);
