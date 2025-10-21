<!-- ad5f1eb5-36ff-4129-8851-b95a92b35afa 63483bed-c40f-4108-a6cb-a33010474601 -->
# Suno-like Overlay Editor (Prompt)

## Scope
- Apply to prompt fields in `internal-packages/workflow-designer-ui/src/editor/properties-panel/text-generation-node-properties-panel/index.tsx`
- Include System prompt if present (same behavior)

## Behavior
- Bottom-right expand icon inside the field opens an overlay editor
- Overlay: fixed, resizable container with header/body/footer
- Save writes value back to the node; Esc closes; Cmd/Ctrl+Enter saves
- Backdrop click closes; focus trap; `aria-expanded` and labels

## Implementation
- Add `internal-packages/ui/components/overlay-text-editor.tsx` (reusable)
- In `.../text-generation-node-properties-panel/index.tsx` (or `prompt-panel.tsx`), render an expand button in the bottom-right of the prompt area and mount `OverlayTextEditor`
- Use existing `PromptEditor` as the editor body for consistency
- Keep tokens (`bg-inverse/*`, borders, radii) and glass layers consistent; avoid visual changes when closed

## Validation
- Open/close/resize works smoothly and does not conflict with canvas events
- Save/Undo/Clear behavior and keyboard shortcuts
- No z-index issues; scroll does not leak to canvas


### To-dos

- [ ] Create reusable OverlayTextEditor (fixed, resizable, header/body/footer)
- [ ] Add bottom-right expand icon to prompt field and open overlay
- [ ] Mirror value into overlay, save back via onConfirm
- [ ] Use existing PromptEditor inside overlay for content editing
- [ ] Add focus trap, aria attributes, Esc close, Cmd/Ctrl+Enter save
- [ ] Apply existing tokens and glass styles; ensure z-index/scroll behavior
- [ ] Verify open/close/resize, save/undo/clear, and no visual regressions