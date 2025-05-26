export type UsageMetric = "input_token" | "output_token";
export type UsageUnit = "tokens";

export type UsageItem = {
	metric: UsageMetric;
	amount: number;
	unit: UsageUnit;
};
