# Furniture generation rules and exact room coordinates

This is the specification for the current 1536 x 1024 room. Here **width** means the horizontal pixel count (the requested "weight"). All coordinates and dimensions below are pixels in the room image, regardless of browser-window size.

## Anchor convention

Every room image currently uses a **top-left anchor**. Its anchor position is `(x, y)`, and its transparent PNG canvas must be exactly `width x height`. For example, the bed's anchor is `(545, 255)` and its PNG is exactly `500 x 355`. The renderer draws the image from x=545 through x=1045 and from y=255 through y=610.

Do not put an object on a 1536 x 1024 transparent sheet to position it. The PNG canvas should have the exact dimensions listed below; the anchor in `src/room/roomLayers.json` positions that canvas. Leave only a small transparent margin so no leg, hanging cord, or shadow is cut off.

## Exact image specification

The active PNGs below live in `dark_rose/items/`, except the room base. The `default` folder is retained as a reference. The order in this table is also the current back-to-front drawing order. Keep the room base at 1536 x 1024.

| Order | Element and PNG filename | Anchor X | Anchor Y | Width | Height | Surface / use |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 01 | Room shell — `01_room_base.png` | 0 | 0 | 1536 | 1024 | Walls and floor; fixed master reference |
| 02 | Window — `room-window.png` | 1120 | 215 | 160 | 285 | Right wall; introduction window |
| 03 | Calendar — `room-calendar.png` | 480 | 170 | 125 | 180 | Left wall |
| 04 | Achievement pinboard — `room-pinboard.png` | 865 | 180 | 155 | 175 | Right wall; achievement area |
| 05 | Award shelf — `room-awards.png` | 1000 | 225 | 150 | 85 | Right wall; achievement area |
| 06 | Wall frame — `room-frame.png` | 1000 | 325 | 100 | 80 | Right wall; achievement area |
| 07 | Rug — `room-rug.png` | 880 | 600 | 320 | 145 | Floor; below desk and bed |
| 08 | Bed and bedside table — `room-bed.png` | 545 | 255 | 500 | 355 | Floor; hero area |
| 09 | Desk and chair — `room-desk.png` | 1000 | 425 | 290 | 245 | Floor; chair remains grouped with desk |
| 10 | Bookshelf and books — `room-bookshelf.png` | 225 | 280 | 170 | 360 | Left wall/floor; diary |
| 11 | Full-length mirror — `room-mirror.png` | 425 | 310 | 125 | 290 | Left wall/floor; AI companion |
| 12 | Bookshelf plant — `room-plant-shelf.png` | 305 | 193 | 100 | 105 | Sits on bookshelf |
| 13 | Hanging plant — `room-plant-hanging.png` | 710 | 45 | 115 | 180 | Ceiling near rear corner |
| 14 | Window plant — `room-plant-window.png` | 1210 | 405 | 60 | 80 | Window sill |
| 15 | Floor plant — `room-plant-floor.png` | 300 | 620 | 115 | 145 | Floor; skill-tree area |

These are **canvas dimensions**, not estimates of the object's visible painted bounds. The object, including its contact shadow or mounting point, must fit entirely inside its canvas. The room base is opaque; the other item PNGs must have transparent backgrounds.

## Functional elements and interaction positions

The game also uses interaction points. They are **not image anchors**: the player can click or approach within the stated radius. When you move the related furniture, change the corresponding point in `src/room/RoomGame.tsx`.

| Function | Visible element | Approach center (x, y) | Radius | Direct click area(s), x/y/width/height |
| --- | --- | --- | ---: | --- |
| Diary | Bookshelf | (430, 680) | 110 | (225, 280, 170, 360) |
| AI companion | Mirror | (520, 650) | 100 | (425, 310, 125, 290) |
| Hero | Bed | (790, 665) | 130 | (545, 255, 500, 355) |
| Achievements | Pinboard, award shelf, frame | (1080, 755) | 145 | (865, 180, 155, 175); (1000, 225, 150, 85); (1000, 325, 100, 80) |
| Skill tree | Floor plant | (440, 768) | 105 | (300, 620, 115, 145) |
| Life novel | Open room floor | (715, 830) | 115 | (520, 675, 380, 225) |

The approach center and radius select the nearby `E` interaction. Direct clicks use the listed rectangles instead of the approach circles, so each panel opens from its visible furniture. Update both values in `src/room/RoomGame.tsx` if an object moves.

Introduction objects are separate game effects. The window mark is centered at `(1200, 420)` with a 44-pixel radius. Clicking near `(1200, 445)` within 165 pixels opens it; its reachable floor approach point is `(1195, 705)` with a 130-pixel radius. The envelope is displayed at center `(1160, 655)` with size `185 x 185`. The mirror can be clicked near `(490, 455)` within 150 pixels, while its floor approach point is `(520, 650)` with a 130-pixel radius. These are not furniture PNGs in `dark_rose/items/`.

## Character walkable area

The character's `(x, y)` position represents its **feet**. Movement keeps the feet inside the four-point floor polygon `(765, 390) → (1400, 622) → (765, 1000) → (130, 622)` and at least 32 pixels from its edges. The same 32-pixel clearance applies around the solid furniture footprints below. The rug is walkable.

| Solid object | Floor footprint polygon, in drawing order |
| --- | --- |
| Bookshelf | (230, 545), (395, 545), (395, 635), (230, 635) |
| Mirror | (425, 520), (545, 520), (555, 605), (425, 605) |
| Bed and bedside table | (545, 430), (755, 470), (1040, 535), (1040, 605), (785, 625), (545, 560) |
| Desk and chair | (1000, 500), (1280, 500), (1290, 650), (1160, 675), (1130, 710), (1000, 690), (980, 625) |
| Floor plant | (310, 665), (390, 665), (410, 740), (370, 780), (305, 750) |

Edit `WALKABLE_FLOOR`, `SOLID_FURNITURE`, and `HERO_FOOT_CLEARANCE` in `src/room/RoomGame.tsx` when furniture moves. Check nearby `E` approach points after any change so panels remain reachable. Click-to-move accepts only floor destinations; keyboard movement slides along a boundary when possible.

## How to generate the next item

1. Attach the chosen theme base (currently `dark_rose/01_room_base.png`) and `current_layout_preview.webp` as visual references. State the item, its surface (left wall, right wall, floor, or ceiling), its exact canvas width and height from the table, and its anchor `(x, y)`.
2. Ask for **one complete object only**, in the same elevated three-quarter camera, warm painted style, outline weight, and light direction. The two horizontal directions of floor furniture must follow the room tiles; vertical edges stay vertical.
3. Request an RGBA PNG with a transparent background and the **exact canvas dimensions** in the table. Do not include a room, painted floor, text, or another object. Do not remove feet, wall brackets, hanging cords, or contact shadow.
4. If the image generator cannot output that exact pixel size, place its result into an exact-size transparent canvas in an image editor. Keep the whole object and its proportions. Do not stretch width and height independently.
5. Replace the matching PNG in `dark_rose/items/`. Do not edit the generated WebP in `public/room/layers/`. Run `python scripts/build_room_layers.py` from the `game-version` directory, then refresh the preview.
6. The builder **does not crop or resize**. It refuses a PNG whose dimensions differ from `roomLayers.json`. For a new furniture type, add a new exact-size PNG and manifest entry, then update this table and any interaction point.

Suggested prompt:

> Use the attached empty room and current layout as exact perspective and scale references. Draw one [ITEM] for the [SURFACE]. Its final transparent PNG canvas must be exactly [WIDTH] x [HEIGHT] pixels. The canvas will be placed with its top-left anchor at ([X], [Y]) on the 1536 x 1024 room. Match the room's elevated three-quarter camera, floor directions, warm palette, outlines, and light direction. Include all feet or mounting points and a soft contact shadow. Do not draw the room, background, text, or unrelated furniture.

A text prompt cannot reliably repair an object drawn from the wrong camera angle. Check its top face, side faces, verticals, and floor/wall contact against the two reference images before accepting it.

## Coordinate and perspective checks

- The rear floor corner is near `(750, 360)`; the wall/floor seams reach roughly `(128, 640)` and `(1408, 640)`; the front floor corner is near `(768, 1000)`.
- Judge a floor object's position by its feet or contact shadow, even though the code anchor is top-left. Wall decorations must remain within their wall plane.
- The list order controls overlap: wall decoration behind standing furniture, rug below desk and bed, plants in front where appropriate.
- `current_layout_preview.webp` is rebuilt from the manifest. Check it at 1536 x 1024 after replacing an image. It shows the static room, without the moving character and game effects.

The loose `desk_chair.png` in `basics/assets/room/` is a 1536 x 1024 draft and is **not loaded** by the game. To use it as the desk, prepare `dark_rose/items/room-desk.png` at exactly `290 x 245`, then rebuild.
