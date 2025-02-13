import type { ReactNode } from "react";
import { SignupContextProvider } from "./context";

export default function Layout({ children }: { children: ReactNode }) {
	return <SignupContextProvider>{children}</SignupContextProvider>;
}
