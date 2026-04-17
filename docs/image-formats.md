# Image format support

This document will explains supported image formats for vision inputs and limitations such as SVG handling.

## Summary

- Most vision models only support image formats such as PNG, JPEG, GIF, and WebP
- SVG (`image/svg+xml`) is not supported by LLM providers generally
- SVG uploads are sometimes accepted in this system however are ignored initially
- This should be prevented or handled explicitly

## Supported Formats 

Currently the following types are supported:
- `image/jpeg`
- `image/png`
- `image/gif`
- `image/webp`

These are compatible with major LLMs

## Unsupported Format: SVG and why it is unsupported

- SVG is not supported for vision inputs
- SVG is a vector based (XML) based, LLMs only support pixel based images (JPEG, PNG etc)
- If SVG is passed to a vision model it may result in an error

## System behavoir prior to fixes

- SVG files mayy still be uploaded through some UI components
- In generation pipelines, SVG files are skipped and are not sent to the model
- A warning may be logged but not visible to feedback

Can result it:
- file upload appearing succesful whilst the image is silently ignored

## Approach to Fix

- Remove SVG from image handling and handle as a unsupported dtype with a clear message or warning
- Avoids confusion and ensures only supported formats are used.

## After Fix, SVG Handling
- SVG is not supported still
- SVG files are explicitly excluded from image processing and will not be sent to LLMs
- SVG has been intentionally removed from vision handling due to provider limitations

