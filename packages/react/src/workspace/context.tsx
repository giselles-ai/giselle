"use client";

import { createContext } from "react";
import type { WorkflowDesignerContextValue } from "./types";

export const WorkflowDesignerContext = createContext<
	WorkflowDesignerContextValue | undefined
>(undefined);
