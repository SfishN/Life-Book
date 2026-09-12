# Introduction Asset Settings

This folder holds production inputs for the mystery introduction.

## Structure

- `fonts/`: self-hosted handwriting fonts, licences, and browser `@font-face` rules.
- `pet/`: transparent pet animation strips.
- `notes/`: transparent interaction-paper variants and leaf assets.
- `objects/`: transparent interactive props and their animation states.

## Handwriting

### A — Kalam Regular

- Role: passionate, fast, relatively round handwriting.
- Browser family: `LifeRoom Hand A`.
- Source: <https://github.com/google/fonts/tree/main/ofl/kalam>
- Licence: SIL Open Font License 1.1; retained as `A-Kalam-OFL.txt`.
- Local file: `fonts/A-Kalam-Regular.ttf`.

### B — Rock Salt Regular

- Role: sharper, rougher, more forceful handwriting.
- Browser family: `LifeRoom Hand B`.
- Source: <https://github.com/google/fonts/tree/main/apache/rocksalt>
- Licence: Apache License 2.0; retained as `B-RockSalt-LICENSE.txt`.
- Local file: `fonts/B-RockSalt-Regular.ttf`.

Import `fonts/font-faces.css`, then apply `.handwriting-a` or `.handwriting-b`. Handwritten dialogue must also have a clean-text accessible transcription; never rely on the font shape alone to identify the writer.

## Planned pet strips

Each browser-ready strip uses one horizontal row, an equal-width frame grid, a fixed foot/body anchor, and genuine RGBA transparency.

| File | Frames | Suggested playback | Loop |
| --- | ---: | ---: | --- |
| `pet/pet-idle-6f.png` | 6 | 5–7 fps | Yes |
| `pet/pet-scuttle-8f.png` | 8 | 10–12 fps | Yes |
| `pet/pet-flutter-8f.png` | 8 | 12–14 fps | Yes |
| `pet/pet-hint-6f.png` | 6 | 7–9 fps | Hold final briefly |
| `pet/pet-sleep-wake-8f.png` | 8 | 6–8 fps | No; idle on first/last frame |

Right-facing movement can be mirrored by the renderer. Do not create a second painted strip unless asymmetrical markings become confusing when flipped.

## Generated introduction assets

All files below were validated as 32-bit RGBA PNGs with transparent corner pixels.

| File | Source size | Layout | Use |
| --- | ---: | ---: | --- |
| `objects/envelope-3f.png` | 2172 × 724 | 3 × 1; 724 × 724 cells | Closed, activated, and opened envelope states |
| `objects/net-sweep-8f.png` | 1774 × 887 | 4 × 2 visual grid | Ready, sweep, follow-through, and recovery sequence |
| `pet/pet-flutter-8f.png` | 1536 × 1024 | 4 × 2; 384 × 512 cells | Crouch, lift, hover, descend, and land |
| `pet/pet-footprint-8.png` | 1774 × 887 | Static decal | Eight-print trail segment; repeat and fade procedurally |
| `pet/pet-threatening-shadow.png` | 1536 × 1024 | Static overlay/mask | Distorted false-horror shadow; render with reduced opacity or Multiply |

Use percentage-based background positioning or atlas rectangles for `net-sweep-8f.png`; its source canvas has odd dimensions and should not be assumed to contain integer-width Phaser spritesheet cells. Runtime optimization may export a padded/downscaled copy, but the source must remain unchanged.

## Note and leaf assets

All five source PNGs use genuine RGBA transparency. Text should be rendered by the browser over the blank material so dialogue branches can reuse the same images.

| File | Source size | Intended use |
| --- | ---: | --- |
| `notes/note-paper-a.png` | 1536 × 1024 | Warm, rounded-edge A note; three to six lines |
| `notes/note-paper-b.png` | 1536 × 1024 | Cool, angular B warning; three to six lines |
| `notes/note-paper-overlap.png` | 1024 × 1536 | Shared A/B exchange; eight to twelve lines |
| `notes/note-paper-tag.png` | 2117 × 743 | Net/object tag; one or two short lines |
| `notes/leaf-note.png` | 1510 × 1042 | B's window leaf; two to four short lines |

These are high-resolution source assets. Export smaller runtime copies during implementation rather than overwriting the originals.

Text should be rendered by the browser over blank paper assets. Do not bake story dialogue into the images.
