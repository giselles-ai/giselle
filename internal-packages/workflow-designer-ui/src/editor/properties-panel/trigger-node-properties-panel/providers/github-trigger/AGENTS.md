# GitHub Trigger Properties Panel — State Model (for Agents)

- Target file: `github-trigger-properties-panel.tsx`
- Location: `internal-packages/workflow-designer-ui/src/editor/properties-panel/trigger-node-properties-panel/providers/github-trigger/`
- Purpose: Capture the user-visible states, transitions, and underlying actions to help agents reason about edits and tests.

## States

- Node state:
  - `configured`: Setup completed with `flowTriggerId`. Properties panel shows `GitHubTriggerConfiguredView`.
  - `template-configured`: Event selected but repository not connected. Shows `GitHubTriggerTemplateConfiguredView` with "Repository setup required" badge.
  - `unconfigured` (implicit): Setup not yet completed. Properties panel drives setup.
  - Enable toggle: `enable: true|false` (controlled via `useGitHubTrigger` in configured view).
- Integration state (`useIntegration().value.github.status`):
  - `unset` | `unauthorized` | `not-installed` | `invalid-credential` | `installed` | `error`.
- Setup wizard state (`step.state`):
  - `select-event` → `select-repository` → `confirm-repository` → `input-callsign` (only for specific events) → configured.

### Events requiring callsign
- `github.issue_comment.created`
- `github.pull_request_comment.created`
- `github.pull_request_review_comment.created`

## High-level Flow

```mermaid
flowchart TD
  Start([Open Properties Panel]) --> CheckConfigured{Node state == "configured"}
  CheckConfigured -- yes --> ConfiguredView[Show Configured View\n(GitHubTriggerConfiguredView)]
  CheckConfigured -- no --> CheckTemplate{Node state == "template-configured"}
  CheckTemplate -- yes --> TemplateView[Show Template View\n(GitHubTriggerTemplateConfiguredView)]
  CheckTemplate -- no --> CheckIntegration{Integration github.status}

  subgraph Integration
    CheckIntegration -- unauthorized --> Unauthorized["Unauthorized UI\n(Continue with GitHub)"]
    CheckIntegration -- not-installed --> NotInstalled["Install App UI\n(Install)"]
    CheckIntegration -- installed --> Wizard[Start Setup Wizard]
    TemplateView -- Connect repository --> Wizard
    CheckIntegration -- invalid-credential --> InvalidCred[Show invalid-credential]
    CheckIntegration -- error --> Err[Show error message]
    CheckIntegration -- unset --> Unset[Show unset]

    Unauthorized -- postMessage: github-app-installed --> Wizard
    NotInstalled -- postMessage: github-app-installed --> Wizard
  end
```

Notes:
- `Unauthorized` and `NotInstalled` use a popup and listen for `window.postMessage({ type: 'github-app-installed' })`, then call `useIntegration().refresh()` to re-fetch status.

## Setup Wizard

```mermaid
stateDiagram-v2
  [*] --> select_event
  select_event: select-event
  select_repo: select-repository
  confirm_repo: confirm-repository
  callsign: input-callsign
  done: configured

  select_event --> select_repo: onSelectEvent(eventId)
  select_repo --> confirm_repo: onSelectRepository(owner/repo/installationId)
  confirm_repo --> select_repo: Back
  confirm_repo --> callsign: isCallsignEvent(eventId)
  confirm_repo --> done: Set Up (non-callsign)
  callsign --> select_repo: Back
  callsign --> done: Set Up (callsign)
```

On "Set Up":
- Build `GitHubFlowTriggerEvent` (with callsign if needed).
- Derive `outputs` from `githubTriggers[eventId].event.payloads.keyof().options`.
- RPC `client.configureTrigger({ trigger: { nodeId, workspaceId, enable: false, configuration: { provider: 'github', repositoryNodeId, installationId, event } }, useExperimentalStorage })`.
- On success: update node data to `configured`, add generated `outputs`, and set name to `On ${trigger.event.label}`.

## Runtime Enable/Disable

```mermaid
stateDiagram-v2
  [*] --> Disabled
  Disabled --> Enabled: enableFlowTrigger()
  Enabled --> Disabled: disableFlowTrigger()
```

- Implemented via `useGitHubTrigger(flowTriggerId)`:
  - Fetches trigger via `getTrigger` and repository fullname for display.
  - Exposes `enableFlowTrigger` / `disableFlowTrigger` which patch `enable` with optimistic updates.

## Code Map (quick references)

- Panel entry and integration branching: `GitHubTriggerPropertiesPanel`.
- Installed flow + wizard host: `Installed` component (in the same file).
- Integration UI states:
  - Unauthorized: `components/unauthorized.tsx` (postMessage → `refresh()`).
  - Not installed: `components/install-application.tsx` (postMessage → `refresh()`).
- Wizard steps:
  - Event selection: `components/event-selection-step.tsx`.
  - Event type display: `components/event-type-display.tsx`.
  - Repository display: `components/repository-display.tsx`.
  - Callsign form: inline in `Installed` under `input-callsign`.
- Helpers:
  - Callsign-needed check: `isTriggerRequiringCallsign()` in panel file.
  - Event builder: `createTriggerEvent()` in `./utils/trigger-configuration` and local `createCallsignEvent()` for callsign variants.
- Post-setup configured view: `../../ui` → `GitHubTriggerConfiguredView`.
- Node badge (enabled/disabled): `node/ui/github-trigger/status-badge.tsx` using `useGitHubTrigger`.

## Acceptance Hints (for testing)

- Integration states render the expected UI and recover after postMessage → `refresh()`.
- Non-callsign events skip the callsign step and reach `configured` after one confirm.
- Callsign events require a non-empty callsign; empty should not proceed.
- After setup, node name becomes `On ${label}` and outputs list matches event payload keys.
- Enabling/disabling reflects in status badge without full reload (optimistic UI).
- Template-configured nodes show badge "Repository setup required" and the name suffix `[Repository setup required]`.
- "Connect repository" moves a template-configured node to `configured` and removes the suffix.

```mermaid
sequenceDiagram
  participant UI as Panel (Installed)
  participant S as Giselle Engine Client
  participant Srv as Engine Server

  UI->>UI: Build event + outputs
  UI->>S: configureTrigger(trigger, useExperimentalStorage)
  S->>Srv: POST /configureTrigger
  Srv-->>S: { triggerId }
  S-->>UI: { triggerId }
  UI->>UI: updateNodeData() → status=configured, name, outputs
```

---

If you update the wizard or integration flow, please also update:
- The state lists above
- The Mermaid diagrams
- The acceptance hints
