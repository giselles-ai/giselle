declare module "next-auth/jwt" {
	interface JWT {
		accessTokenExpires: number;
		message?: string;
	}
}
