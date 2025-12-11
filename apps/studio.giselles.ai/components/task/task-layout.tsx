export function TaskLayout({ children }: React.PropsWithChildren) {
	return (
		<div className="bg-bg text-foreground h-full font-sans overflow-y-hidden">
			<div className="max-w-[640px] mx-auto px-4 flex flex-col h-full">
				{children}
			</div>
		</div>
	);
}
