import { getCurrentUser } from "@/lib/get-current-user";
import { SentryUserProvider } from "./sentry-user-provider";

interface SentryUserWrapperProps {
	children: React.ReactNode;
}

export async function SentryUserWrapper({ children }: SentryUserWrapperProps) {
	let userId: string | undefined;

	try {
		const currentUser = await getCurrentUser();
		userId = currentUser.id;
	} catch {
		// User not available, continue without setting Sentry user
	}

	return <SentryUserProvider userId={userId}>{children}</SentryUserProvider>;
}
