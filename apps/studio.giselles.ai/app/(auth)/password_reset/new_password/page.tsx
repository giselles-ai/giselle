import { Form } from "./form";

export default async function LoginPage() {
	return (
		<div className="min-h-screen flex items-center justify-center p-4 gap-16">
			<div className="flex items-center justify-center py-12">
				<div className="mx-auto grid w-[350px] gap-[24px]">
					<div className="text-center">
						<h2
							className="mt-6 text-[28px] font-[500] text-primary-100 font-hubot text-center"
							style={{ textShadow: "0px 0px 20px #0087F6" }}
						>
							Set new password
						</h2>
						<p className="mt-4 text-[14px] font-geist text-primary-300">
							Your new password must be different to previously used passwords.
						</p>
					</div>
					<Form />
				</div>
			</div>
		</div>
	);
}
