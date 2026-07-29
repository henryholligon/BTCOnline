---
name: QR rendering
description: QR codes must use a standard QR renderer for scanner compatibility.
---

Use a standard QR generation library with high error correction, a full quiet zone, and conservative logo coverage. Do not hand-draw or overwrite QR modules to imitate a visual reference; custom SVG approximations can look correct but fail phone scanners.

**Why:** A hand-drawn QR approximation with an oversized center logo was not reliably detected by phones, while preserving the renderer’s QR matrix is the safer approach.

**How to apply:** Keep styling changes within the QR renderer’s supported options, preserve the canonical merchant URL, and test scanability whenever changing logo size, margins, or eye/body geometry.