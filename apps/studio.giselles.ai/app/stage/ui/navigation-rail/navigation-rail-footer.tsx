export const NavigationRailFooter = ({ children }: React.PropsWithChildren) => {
	return (
		<div className="relative data-slot-navigation-rail-footer absolute bottom-0 h-navigation-rail-footer w-full p-1.5 group rounded-md overflow-hidden border border-border hover:border-light-border backdrop-blur-md transition-colors bg-(image:--glass-bg)">
			<div className="absolute top-0 left-2 right-2 h-px bg-(image:--glass-highlight-bg) opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none" />
			<div className="flex items-center h-full w-full [&_*]:bg-transparent [&_*:hover]:bg-transparent">
				{children}
			</div>
		</div>
	);
};
