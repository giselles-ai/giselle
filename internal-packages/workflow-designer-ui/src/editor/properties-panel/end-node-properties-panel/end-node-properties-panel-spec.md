## EndNodePropertiesPanel Specification

**Component**: `EndNodePropertiesPanel`

**Location**: `internal-packages/workflow-designer-ui/src/editor/properties-panel/end-node-properties-panel/index.tsx`

**Primary goal**: Let users choose which upstream node outputs become the **App result** by connecting those nodes to the **End node**.

---

## Functional responsibilities (behavior contract)

- **Show current App outputs**: List which nodes are currently connected into the End node.
- **Allow adding outputs**: Connect an upstream node’s outputs to the End node (via dropdown).
- **Allow removing outputs**: Disconnect an upstream node from the End node (removes all connections between the pair).
- **Gate “Try App in Stage”**: Disable the CTA until the graph has a path from Start (AppEntry) to End.

---

## Inputs / External State

### Props

- **`node: EndNode`**: The End node whose properties are displayed.

### Store state (read)

Read from `useAppDesignerStore`:

- **`nodes`**: The full node list.
- **`connections`**: The full connection list.
- **`isStartNodeConnectedToEndNode()`**: Derived boolean computed from `nodes` + `connections` (BFS/graph reachability).

### Store actions (write)

- **`useUpdateNodeData()`**: Wraps `updateNode(node.id, data)`.
- **`useDeleteNode()`**: Deletes a node and removes affected connections + cleans up input pins.
- **`useConnectNodes()`**: Connects an output node to an input node by:
  - For **each output** of the output node:
    - Creating a new input on the input node.
    - Creating a connection `outputNode.outputId -> inputNode.newInputId`.
- **`useDisconnectNodes()`**: Removes **all** connections from a given output node to a given input node.
  - Also removes the corresponding `inputId`s from the input node’s `inputs` (for operation nodes that are not action nodes).

---

## Derived State (computed inside the component)

### 1) `connectedOutputsByOutputNode`

A grouped view of `connections` where `connection.inputNode.id === endNode.id`.

- Group key: `connection.outputNode.id`
- Group contents: All connections from that output node into the end node.
- Display label per connection:
  - Prefer `outputNode.outputs.find(o => o.id === connection.outputId)?.label`
  - Fallback to `connection.outputId`
- Groups are sorted by `defaultName(outputNode)`.

**Why this matters**: the UI state (empty vs list) depends on whether this group list is empty.

### 2) `availableOutputSourceNodes`

Candidate upstream nodes shown in “Add output” dropdown.

Filters applied (in order):

- Exclude the End node itself.
- Exclude nodes already connected to this End node (by outputNodeId).
- Exclude nodes with `outputs.length === 0`.
- Exclude nodes with `content.type === "appEntry"`.

**Invariant**: The dropdown never offers nodes that cannot contribute an output.

### 3) `isTryAppInStageDisabled`

- `isTryAppInStageDisabled = !isStartNodeConnectedToEndNode`

`isStartNodeConnectedToEndNode` is calculated in `app-slice.ts` by constructing an adjacency list from `connections` and doing BFS from all AppEntry nodes until an End node is reached.

---

## Behavior states & transitions

This component does not use local React state. All meaningful changes are driven by store mutations.

### State A: No outputs connected

**Condition**: `connectedOutputsByOutputNode.length === 0`

**UI**:

- Shows an “empty” callout: “No outputs are connected to this End node yet.”
- Shows `Add output` button (enabled only if `availableOutputSourceNodes.length > 0`).
- If `availableOutputSourceNodes.length === 0`, shows helper text:
  - “Add a node to use as an App output first.”

**Transitions out**:

- User selects a node in `Add output` dropdown:
  - Calls `connectNodes(outputNodeId, endNodeId)`
  - Store updates `nodes` (adds new inputs on end node) and `connections` (adds one connection per output).
  - UI re-renders into State B.

### State B: One or more outputs connected

**Condition**: `connectedOutputsByOutputNode.length > 0`

**UI**:

- Header row shows `Add output` dropdown (only rendered in this state).
- List of connected output nodes (grouped):
  - Each group shows node icon + node name.
  - If multiple outputs from the same node are connected, it shows a nested list of output labels.
  - Hovering a row reveals a “Disconnect” (trash) button.

**Transitions**:

- User clicks “Disconnect” on a group:
  - Calls `disconnectNodes(outputNodeId, endNodeId)`
  - Store updates `connections` (removes all between the pair)
  - Store updates `nodes` (removes the corresponding created inputs on end node)
  - UI re-renders; if it becomes empty, returns to State A.

### State C: “Try App in Stage” disabled

**Condition**: `isTryAppInStageDisabled === true`

**UI**:

- The CTA button is disabled.
- Help text is shown:
  - “Connect your flow so it reaches the End Node from the Start Node to enable “Try App in Stage”.”

**Transition**:

- Any edit to the graph (connections/nodes) that creates a path from AppEntry → … → End flips the computed flag to enabled.

### State D: “Try App in Stage” enabled

**Condition**: `isTryAppInStageDisabled === false`

**UI**:

- CTA is enabled.

**Important**: The button currently has **no `onClick` handler**. Any wiring should be done intentionally and tested end-to-end.

---

## Important Constraints / Invariants (Do Not Break)

- **Connect/disconnect are pairwise** at the node level:
  - “Connect” creates **one connection per output** of the selected output node.
  - “Disconnect” removes **all** connections between that output node and the end node.
- **End node inputs are implicitly managed** by connect/disconnect:
  - Connecting creates new inputs on the End node.
  - Disconnecting removes those inputs.
- **AppEntry nodes must never appear** in “Add output” options.
- **Nodes without outputs must never appear** in “Add output” options.
- **The UI must remain resilient** when a connection references an output node that no longer exists:
  - The list currently skips groups where `outputNode` is missing (it `continue`s).

---

## Notes for Designers (Safe vs Unsafe Changes)

This section is intentionally **not** about “good UX.” It is a guardrail list to keep the **required behavior** intact.\n+
### Safe changes (generally safe if behavior stays the same)

- Visual styling (spacing, colors, typography, hover transitions).
- Copy changes (labels/help text) as long as meaning remains and conditions still apply.
- Layout changes that preserve these required affordances:
  - The “Add output” affordance
  - The “Disconnect” affordance
  - The disabled/enabled gating of the CTA

### Risky changes (likely to break required behavior)

- Changing which connections are considered “connected outputs” (must stay `connection.inputNode.id === endNode.id`).
- Altering the filters for `availableOutputSourceNodes` without understanding graph semantics.
- Replacing `connectNodes`/`disconnectNodes` with partial connection edits (will desync End node inputs).
- Removing semantics/labels from interactive elements (e.g., the disconnect button’s `aria-label`) which are used for regression safety.

---

## Post-change “Did we break required behavior?” Checklist

Use this after any Vibe Coding / styling refactor.

### Visual & Interaction

- [ ] When End node has **no connected outputs**, an empty state appears and an `Add output` button is visible.
- [ ] When End node has **some connected outputs**, the list renders and an `Add output` button is visible in the header.
- [ ] Hovering a connected output row reveals the disconnect trash button.
- [ ] Clicking disconnect removes that node from the list (and if it was the last one, returns to empty state).

### Add output dropdown rules

- [ ] If there are **no eligible nodes**, `Add output` is disabled.
- [ ] Nodes that are already connected to End **do not appear**.
- [ ] Nodes with **no outputs** do not appear.
- [ ] The **Start/AppEntry node** does not appear.

### Graph semantics

- [ ] Selecting a node in `Add output` creates connections from **every output** of that node into End (verify multiple outputs show as sub-items).
- [ ] Disconnect removes **all** connections between that node and End (verify the multi-output group disappears fully).

### “Try App in Stage” gating

- [ ] With no path from Start → … → End, CTA is disabled and help text is shown.
- [ ] After creating a path from Start → … → End, CTA becomes enabled.
- [ ] CTA remains a button element and still reflects the enabled/disabled state correctly.

### Accessibility / Regression safety

- [ ] Disconnect button retains an `aria-label` describing the action.
- [ ] “Add output” remains keyboard accessible via the dropdown trigger.

