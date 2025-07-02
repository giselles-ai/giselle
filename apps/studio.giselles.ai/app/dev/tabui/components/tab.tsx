"use client";

import {
	createContext,
	type FC,
	type PropsWithChildren,
	type ReactNode,
	useContext,
	useMemo,
	useState,
} from "react";

// Create a context for the tab state
const TabContext = createContext<
	| {
			activeTab: string;
			setActiveTab: (tab: string) => void;
	  }
	| undefined
>(undefined);

// TabProvider component
export const TabProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [activeTab, setActiveTab] = useState<string>("");

	return (
		<TabContext.Provider value={{ activeTab, setActiveTab }}>
			{children}
		</TabContext.Provider>
	);
};

// Custom hook to use the tab context
const useTabContext = () => {
	const context = useContext(TabContext);
	if (!context) {
		throw new Error("useTabContext must be used within a TabProvider");
	}
	return context;
};

type TabProps = {
	value: string;
	className?: string;
};

// Tab component
export const TabTrigger: React.FC<PropsWithChildren<TabProps>> = ({
	value,
	className,
	children,
}) => {
	const { activeTab, setActiveTab } = useTabContext();

	return (
		<button
			className={className}
			type="button"
			onClick={() => setActiveTab(value)}
			data-state={activeTab === value ? "active" : "inactive"}
		>
			{children}
		</button>
	);
};

export const TabContent: React.FC<PropsWithChildren<TabProps>> = ({
	value,
	className,
	children,
}) => {
	const { activeTab } = useTabContext();

	if (activeTab !== value) return null;

	return <div className={className}>{children}</div>;
};

// TabGroup component
type TabGroupProps = {
	className?: string;
};
export const TabGroup: FC<PropsWithChildren<TabGroupProps>> = ({
	className,
	children,
}) => {
	return <div className={className}>{children}</div>;
};
