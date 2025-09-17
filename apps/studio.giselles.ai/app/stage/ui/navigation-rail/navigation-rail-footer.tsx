export const NavigationRailFooter = ({ children }: React.PropsWithChildren) => {
	return (
		<div className="data-slot-navigation-rail-footer absolute bottom-0 h-navigation-rail-footer w-full p-1.5 group">
			<div className="relative w-full h-full rounded-md overflow-hidden border border-white/10 hover:border-white/20 backdrop-blur-md transition-colors bg-[linear-gradient(135deg,rgba(150,150,150,0.03)_0%,rgba(60,90,160,0.12)_100%)]">
				<div className="absolute top-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none" />
				<div className="flex items-center h-full w-full px-1.5 [&_*]:bg-transparent [&_*:hover]:bg-transparent">
					{children}
				</div>
			</div>
		</div>
	);
};
