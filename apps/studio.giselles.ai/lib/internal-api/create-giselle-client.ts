"use client";

import type { GiselleClient } from "@giselles-ai/react";
import * as internalApi from "@/lib/internal-api";

export function createInternalGiselleClient(): GiselleClient {
	return {
		// bootstrap
		createWorkspace: internalApi.createWorkspace,
		createSampleWorkspaces: internalApi.createSampleWorkspaces,

		// workspaces
		getWorkspace: internalApi.getWorkspace,
		updateWorkspace: internalApi.updateWorkspace,

		// apps
		getApp: internalApi.getApp,
		saveApp: internalApi.saveApp,
		deleteApp: internalApi.deleteApp,

		// tasks
		createTask: internalApi.createTask,
		startTask: internalApi.startTask,
		getWorkspaceInprogressTask: internalApi.getWorkspaceInprogressTask,
		getTaskGenerationIndexes: internalApi.getTaskGenerationIndexes,
		getWorkspaceTasks: internalApi.getWorkspaceTasks,

		// generations
		getGeneration: internalApi.getGeneration,
		getNodeGenerations: internalApi.getNodeGenerations,
		cancelGeneration: internalApi.cancelGeneration,
		setGeneration: internalApi.setGeneration,
		generateImage: internalApi.generateImage,
		startContentGeneration: internalApi.startContentGeneration,
		getGenerationMessageChunks: internalApi.getGenerationMessageChunks,
		generateContent: internalApi.generateContent,

		// triggers + ops
		resolveTrigger: internalApi.resolveTrigger,
		configureTrigger: internalApi.configureTrigger,
		getTrigger: internalApi.getTrigger,
		setTrigger: internalApi.setTrigger,
		reconfigureGitHubTrigger: internalApi.reconfigureGitHubTrigger,
		executeAction: internalApi.executeAction,
		executeQuery: internalApi.executeQuery,
		getGitHubRepositoryFullname: internalApi.getGitHubRepositoryFullname,

		// files
		uploadFile: internalApi.uploadFile,
		removeFile: internalApi.removeFile,
		copyFile: internalApi.copyFile,
		getFileText: internalApi.getFileText,
		addWebPage: internalApi.addWebPage,

		// secrets
		addSecret: internalApi.addSecret,
		deleteSecret: internalApi.deleteSecret,
		getWorkspaceSecrets: internalApi.getWorkspaceSecrets,
	};
}
