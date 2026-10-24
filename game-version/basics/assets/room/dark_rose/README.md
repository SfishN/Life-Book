# Dark rose room theme

This folder contains a complete 15-layer alternative for the 1536 × 1024 room. It follows the layer order, top-left anchors, and exact PNG canvas sizes in [`../FURNITURE_GENERATION_RULES.md`](../FURNITURE_GENERATION_RULES.md) and `game-version/src/room/roomLayers.json`.

## Files

- `01_room_base.png`: opaque room shell, 1536 × 1024.
- `source/`: the 14 full-resolution transparent furniture and decoration PNGs used to build the runtime textures.
- `current_layout_preview.webp`: all 15 layers composed at the canonical anchors, without the character or game effects.

The runtime sprites keep the full pixel dimensions of these isolated cutouts. Phaser scales them to the display rectangles in `roomLayers.json`, preserving detail on high-density screens and while zooming. The palette uses deep rosewood, burgundy and dusty rose fabric, warm cream, antique brass, and muted sage plants. The elevated three-quarter camera, room geometry, and furniture footprint follow the default room.

## Reuse and placement

Use the PNGs in `source/` and keep their full resolution. Draw them in manifest order, scaling each one to the manifest's target rectangle at runtime. Keep the base at `(0, 0)` and 1536 × 1024. Interaction points are documented in the parent generation rules and remain separate from image anchors.

This is the active game theme. `scripts/build_room_layers.py` copies the original full-resolution PNGs byte-for-byte into the runtime folder, without resizing or lossy conversion. The original `default` assets remain available as a reference.

## Generation prompt pattern

Use the default room shell and layout preview as perspective references. Generate one isolated object on a transparent background for the named layer. Match the room's elevated three-quarter view, tile directions, vertical edges, painted outlines, and light direction. Use deep rosewood, burgundy or dusty rose fabric, warm cream, antique brass, and muted sage foliage. Include the entire object, mounting point or feet, and contact shadow. Fit it proportionally into the exact canvas in the parent rules and place that canvas at its listed anchor.
