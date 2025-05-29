// ProseMirror core exports
export * from "./prosemirror/editor";
export * from "./prosemirror/schema";
export * from "./prosemirror/plugins";
export * from "./prosemirror/conversion";
export * from "./prosemirror/list-commands";
export * from "./prosemirror/source-extension";

// Legacy compatibility exports (using ProseMirror internally)
export { isJsonContent } from "./prosemirror/conversion";
export { jsonContentToText } from "./prosemirror/conversion";

// Create default extensions configuration for backward compatibility
export const extensions = [];

// Re-export specific classes and functions for easier imports
export { ProseMirrorEditor } from "./prosemirror/editor";
export { ProseMirrorConverter } from "./prosemirror/conversion";
