# Dependency patches

## streamdown 2.0.1

`streamdown@2.0.1.patch` disables only the automatic KaTeX stylesheet injector
(`Jn`) in the distributed ESM and CommonJS bundles. Streamdown hardcodes KaTeX
0.16.22 CSS, which does not match the class names emitted by the patched KaTeX
0.18.2 renderer. The workflow designer imports the matching CSS and fonts from
its direct `katex` dependency instead.

The CDN setting and Mermaid loader are unchanged: setting `cdnUrl={null}` would
also disable Mermaid. Remove this patch when upgrading to a Streamdown version
that supports matching local KaTeX styles without injecting the old stylesheet.
