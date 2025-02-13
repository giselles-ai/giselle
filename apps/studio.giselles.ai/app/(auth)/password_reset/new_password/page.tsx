import { PageHeader } from "../../components/page-header";
import { Form } from "./form";

export default async function LoginPage() {
	return (
		<div className="min-h-screen flex items-center justify-center p-4 gap-16">
			<div className="flex items-center justify-center py-12">
				<div className="mx-auto grid w-[350px] gap-[24px]">
					<PageHeader
						title="Set new password"
						description="Your new password must be different to previously used passwords."
					/>
					<Form />
				</div>
			</div>
		</div>
	);
}
