import { ArrowRight, Check } from "lucide-react";

interface StepperProps {
	currentStep: number;
}

export function Stepper({ currentStep }: StepperProps) {
	return (
		<div className="flex items-center justify-between w-full mb-8 px-4">
			<StepItem
				step={1}
				currentStep={currentStep}
				title="Authorize with GitHub"
				description="Connect your GitHub account"
			/>

			<div className="flex items-center">
				<ArrowRight className="h-5 w-5 text-indigo-400 mx-4" />
			</div>

			<StepItem
				step={2}
				currentStep={currentStep}
				title="Install GitHub App"
				description="Set up the GitHub application"
			/>

			<div className="flex items-center">
				<ArrowRight className="h-5 w-5 text-indigo-400 mx-4" />
			</div>

			<StepItem
				step={3}
				currentStep={currentStep}
				title="Setup Integration"
				description="Configure integration settings"
			/>
		</div>
	);
}

interface StepItemProps {
	step: number;
	currentStep: number;
	title: string;
	description: string;
}

function StepItem({ step, currentStep, title, description }: StepItemProps) {
	return (
		<div className="flex flex-col items-center">
			<div
				className={`
					w-16 h-16 rounded-full flex items-center justify-center mb-3
					${currentStep > step ? "bg-indigo-600" : currentStep === step ? "bg-indigo-600" : "bg-slate-800"}
				`}
			>
				{currentStep > step ? (
					<Check className="h-8 w-8 text-white" />
				) : (
					<span className="text-xl font-medium">{step}</span>
				)}
			</div>
			<div className="text-center">
				<span
					className={`text-sm font-medium block mb-1 ${
						currentStep === step
							? "text-indigo-400"
							: currentStep > step
								? "text-white"
								: "text-gray-400"
					}`}
				>
					{title}
				</span>
				<span className="text-xs text-gray-500 block max-w-[150px]">
					{description}
				</span>
			</div>
		</div>
	);
}
