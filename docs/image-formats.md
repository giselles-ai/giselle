# Image Format Support

This document explains supported image formats for vision inputs and limitations such as SVG handling.

## Summary

- Most vision models support raster image formats such as PNG, JPEG, and GIF
- SVG (`image/svg+xml`) is not supported by LLM providers
- SVG inputs may still be accepted by the system but can cause errors at runtime
- Developers should avoid using SVG for vision inputs or handle it explicitly

---

## Provider-Supported Formats for Vision Inputs

Supported image formats for vision inputs:

- image/png (PNG)
- image/jpeg (JPEG)
- image/gif (GIF)

These formats are compatible with major LLM providers.

---

## Unsupported Format: SVG

SVG (`image/svg+xml`) is not supported for vision inputs.

### Why SVG is not supported

SVG (image/svg+xml) is not supported.

Vision model providers require rasterized pixel data. SVG is a vector format and will fail at runtime even if accepted by file pickers.

Users should convert SVG files to PNG or JPEG before upload.`UnknownError: Unsupported MIME type: image/svg+xml`


---

## Current Behavior

- SVG files may still be accepted by the system
- SVG files can be passed to vision models in some cases
- This may result in runtime errors due to unsupported MIME types

---

## Recommended Handling

Developers should avoid using SVG files for vision inputs and instead convert them to supported raster formats such as PNG or JPEG.
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