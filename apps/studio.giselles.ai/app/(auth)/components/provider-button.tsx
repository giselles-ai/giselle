import type { ReactNode } from "react";

interface ProviderButtonProps {
	icon: ReactNode;
	label: string;
	formAction: (formData: FormData) => void | Promise<void>;
	returnUrl?: string;
}

export function ProviderButton({
	icon,
	label,
	formAction,
	returnUrl,
}: ProviderButtonProps) {
	const baseButtonClass =
		"w-full relative flex items-center justify-center rounded-[8px] border border-inverse/20 bg-transparent text-text py-[8px] px-[20px] transition-colors duration-200 hover:bg-blue-pale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700/60 group";
	const iconWrapperClass =
		"absolute left-[20px] flex items-center [&>svg]:text-text group-hover:[&>svg]:text-auth-dark group-hover:[&>svg]:fill-auth-dark";

	return (
		<form className="relative w-full">
			{returnUrl && <input type="hidden" name="returnUrl" value={returnUrl} />}
			<button
				type="submit"
				formAction={formAction}
				aria-label={label}
				className={baseButtonClass}
			>
				<span className={iconWrapperClass} aria-hidden>
					{icon}
				</span>
				<span className="font-sans text-[16px] font-medium group-hover:text-auth-dark">
					{label}
				</span>
			</button>
		</form>
	);
}
