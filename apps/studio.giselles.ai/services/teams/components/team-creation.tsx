import invariant from "tiny-invariant";
import { getUser } from "@/lib/supabase";
import { formatStripePrice, getCachedPrice } from "@/services/external/stripe";
import { fetchUserTeams } from "../fetch-user-teams";
import { canCreateFreeTeam } from "../plan-features/free-team-creation";
import { TeamCreationForm } from "./team-creation-form";

export default async function TeamCreation({
	children,
}: {
	children?: React.ReactNode;
}) {
	const user = await getUser();
	if (!user) {
		throw new Error("User not found");
	}
	const teams = await fetchUserTeams();
	const proPlanPriceId = process.env.STRIPE_PRO_PLAN_PRICE_ID;
	invariant(proPlanPriceId, "STRIPE_PRO_PLAN_PRICE_ID is not set");
	const proPlan = await getCachedPrice(proPlanPriceId);
	const proPlanPrice = formatStripePrice(proPlan);

	return (
		<TeamCreationForm
			canCreateFreeTeam={canCreateFreeTeam(
				user.email,
				teams.map((t) => t.plan),
			)}
			proPlanPrice={proPlanPrice}
		>
			{children}
		</TeamCreationForm>
	);
}
