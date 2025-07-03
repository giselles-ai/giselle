export type AuthPageProps = {
	searchParams: Promise<{
		returnUrl?: string;
	}>;
};

export type AuthComponentProps = {
	returnUrl?: string;
};
