import { Note } from "@giselle-internal/ui/note";
import { Select } from "@giselle-internal/ui/select";
import { useIntegration } from "@giselle-sdk/integration/react";
import { InstallGitHubApplication } from "./install-application";
import { Unauthorized } from "./unauthorized";

export function GitHubConnectFieldsets() {
	const { value } = useIntegration();
	if (!value.github) {
		return (
			<Note type="error">Error: GitHub integration is not set up yet.</Note>
		);
	}
	switch (value.github.status) {
		case "unset":
			return (
				<Note type="error">Error: GitHub integration is not set up yet.</Note>
			);
		case "unauthorized":
			return <Unauthorized authUrl={value.github.authUrl} />;
		case "error":
			return <Note type="error">{value.github.errorMessage}</Note>;
		case "invalid-credential":
			return <Note type="error">Invalid GitHub token.</Note>;
		case "not-installed":
			return (
				<InstallGitHubApplication
					installationUrl={value.github.installationUrl}
				/>
			);
		case "installed":
			return (
				<>
					<fieldset className="flex flex-col">
						<label
							htmlFor="Repository"
							className="text-text text-[13px] mb-[2px]"
						>
							Repository
						</label>

						<Select
							name="repositoryNodeId"
							options={value.github.repositories}
							renderValue={(option) => option.node_id}
							renderOption={(option) => option.full_name}
							placeholder="Select provider..."
						/>
					</fieldset>
					<fieldset className="flex flex-col">
						<div className="flex justify-between mb-[2px]">
							<label htmlFor="scope" className="text-text text-[13px]">
								Scope
							</label>
						</div>
						<Select
							name="scope"
							id="scope"
							options={[{ id: "code", label: "Code" }]}
							renderOption={(option) => option.label}
							placeholder="Select scope..."
						/>

						<p className="text-[11px] text-text-muted px-[4px] mt-[1px]">
							Select the repository scope to connect. Only Code is currently
							available.
						</p>
					</fieldset>

					{/**  @todo select */}
					<input type="hidden" name="installationId" value="199999" />
				</>
			);
		default: {
			const _exhaustiveCheck: never = value.github;
			throw new Error(`Unhandled provider: ${_exhaustiveCheck}`);
		}
	}
}
