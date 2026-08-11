# Fonts

These files are redistributed here under the SIL Open Font License, Version 1.1,
which permits bundling and self-hosting.

| File | Family | Designer / source |
|---|---|---|
| `instrument-sans-var.woff2` | Instrument Sans | Instrument, via Google Fonts |
| `instrument-serif-400.woff2` | Instrument Serif | Instrument, via Google Fonts |
| `instrument-serif-400-italic.woff2` | Instrument Serif Italic | Instrument, via Google Fonts |
| `geist-mono-var.woff2` | Geist Mono | Vercel, via Google Fonts |

Latin subset only, since the page is in English. The two variable files cover
their full weight range in one request each, which is why there is no separate
file per weight.

Full licence text: <https://openfontlicense.org/open-font-license-official-text/>

## Why these are self-hosted

Three reasons, in order of how much they matter here:

1. Google was returning 404 for the Geist Mono files, so the terminal silently
   fell back to a system mono.
2. It removes every external request from the page. Nothing about a visitor
   reaches a third party.
3. It is faster. No DNS, no TLS handshake and no round trip to another origin
   before text can render in its intended face.
