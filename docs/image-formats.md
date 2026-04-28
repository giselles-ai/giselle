# Image Format Support

This document explains supported image formats for vision inputs and limitations such as SVG handling.

## Summary

- Vision models support raster image formats such as PNG, JPEG, and GIF
- SVG (image/svg+xml) is not supported by vision model providers
- SVG inputs may still be accepted by some file pickers but will fail at runtime
- Developers should avoid using SVG for vision inputs or handle it explicitly

---

## Provider-Supported Formats for Vision Inputs

Supported image formats for vision inputs:

- image/png (PNG)
- image/jpeg (JPEG)
- image/gif (GIF)

Only PNG, JPEG, and GIF are guaranteed to work through the full vision and generation pipeline.
Some file pickers in the UI may allow additional image MIME types, but those are not reliably supported at runtime.
---

## Unsupported Format: SVG

SVG (`image/svg+xml`) is not supported for vision inputs.

### Why SVG is not supported

SVG (image/svg+xml) is not supported.

Vision model providers require rasterized pixel data. SVG is a vector format and will fail at runtime even if accepted by file pickers.

Users should convert SVG files to PNG or JPEG before upload.


---

## Current Behavior

- SVG files may still be accepted by the system
- SVG files can be passed to vision models in some cases
- This may result in runtime errors due to unsupported MIME types

---

## Recommended Handling

### Avoid SVG for vision inputs

Use supported raster MIME types instead:

- `image/png` (PNG)
- `image/jpeg` (JPEG)
- `image/gif` (GIF)

---

### Convert SVG to a raster format

If SVG input is required, convert it before use:

- server-side (e.g. image processing tools)
- client-side (e.g. canvas rendering)

---

### Validate file types early

Reject unsupported formats and provide a clear error message, for example:

> "SVG is not supported. Please use PNG/JPEG/GIF instead.."

---

## Developer Notes

- `image/svg+xml` should not be treated as a valid `ImagePart` for vision inputs
- Validation should be applied consistently across UI and backend
- Mismatches between accepted file types and backend handling can lead to confusing behavior