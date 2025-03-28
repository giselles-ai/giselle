export type AgentActivity = {
	dbId: number;
	totalDurationMs: number;
	endedAt: Date;
	usageReportDbId: number | null;
};

export type Subscription = {
	subscriptionId: string;
	currentPeriodStart: Date;
	currentPeriodEnd: Date;
};
