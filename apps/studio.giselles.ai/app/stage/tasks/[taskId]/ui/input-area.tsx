"use client";

interface InputAreaProps {
	appId: string;
	teamId: string;
}

export function InputArea({ appId: _appId, teamId: _teamId }: InputAreaProps) {
	// This will need to be passed as props or fetched
	// For now, creating a placeholder
	return (
		<div className="mt-8 pt-8 border-t border-border">
			<div className="mb-4">
				<h2 className="text-[16px] font-medium text-text">
					Request new tasks in a new session
				</h2>
			</div>
			{/* Input form will be integrated here */}
			<div className="rounded-lg border border-border bg-white/5 p-4">
				<input
					type="text"
					placeholder="Ask anything—powered by Giselle docs"
					className="w-full bg-transparent border-0 outline-none text-text placeholder:text-text-muted"
				/>
			</div>
		</div>
	);
}
