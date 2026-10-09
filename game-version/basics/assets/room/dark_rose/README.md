# Dark rose room theme

This folder contains a complete 15-layer alternative for the 1536 × 1024 room. It follows the layer order, top-left anchors, and exact PNG canvas sizes in [`../FURNITURE_GENERATION_RULES.md`](../FURNITURE_GENERATION_RULES.md) and `game-version/src/room/roomLayers.json`.

## Files

- `01_room_base.png`: opaque room shell, 1536 × 1024.
- `items/`: the 14 transparent furniture and decoration PNGs. Each canvas exactly matches its corresponding `target` width and height in `roomLayers.json`; the filename matches the manifest's `source` field.
- `current_layout_preview.webp`: all 15 layers composed at the canonical anchors, without the character or game effects.
- `source/`: original high-resolution image generations kept for future edits. These are not runtime sprites and do not have the target canvas sizes.

The sprites were generated as isolated cutouts, then fitted proportionally inside their exact transparent canvases. Their visible contents were not cropped or stretched. The palette uses deep rosewood, burgundy and dusty rose fabric, warm cream, antique brass, and muted sage plants. The elevated three-quarter camera, room geometry, and furniture footprint follow the default room.

## Reuse and placement

Use the PNGs in `items/` directly at the manifest's top-left `(x, y)` coordinates. Draw them in manifest order. Do not apply a second crop or resize during the build. Keep the base at `(0, 0)` and 1536 × 1024. Interaction points are documented in the parent generation rules and remain separate from image anchors.

This is the active game theme. `scripts/build_room_layers.py` reads this folder and writes compressed WebP layers to `public/room/layers/`. The original `default` assets remain available as a reference.

## Generation prompt pattern

Use the default room shell and layout preview as perspective references. Generate one isolated object on a transparent background for the named layer. Match the room's elevated three-quarter view, tile directions, vertical edges, painted outlines, and light direction. Use deep rosewood, burgundy or dusty rose fabric, warm cream, antique brass, and muted sage foliage. Include the entire object, mounting point or feet, and contact shadow. Fit it proportionally into the exact canvas in the parent rules and place that canvas at its listed anchor.
