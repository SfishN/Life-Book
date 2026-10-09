"""Validate exact-size room PNGs, then compress them for Phaser."""

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "basics" / "assets" / "room" / "dark_rose"
OUTPUT = ROOT / "public" / "room" / "layers"
MANIFEST = ROOT / "src" / "room" / "roomLayers.json"


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    layers = json.loads(MANIFEST.read_text(encoding="utf-8"))
    for layer in layers:
        if "crop" in layer or "clipBelowLine" in layer:
            raise ValueError(f"{layer['id']}: crop metadata is no longer supported")
        _, _, width, height = layer["target"]
        source_path = SOURCE / layer["source"]
        with Image.open(source_path) as image:
            if image.size != (width, height):
                raise ValueError(
                    f"{source_path}: expected {width} x {height} pixels, got "
                    f"{image.width} x {image.height}. Export the PNG at its final size."
                )
            destination = OUTPUT / layer["file"]
            image.convert("RGBA").save(destination, "WEBP", quality=88, method=6)
        print(f"{destination.relative_to(ROOT)}: {destination.stat().st_size:,} bytes")

    preview = Image.new("RGBA", (1536, 1024))
    for layer in layers:
        with Image.open(OUTPUT / layer["file"]) as image:
            preview.alpha_composite(image.convert("RGBA"), tuple(layer["target"][:2]))
    preview_path = ROOT / "basics" / "assets" / "room" / "current_layout_preview.webp"
    preview.convert("RGB").save(preview_path, "WEBP", quality=88, method=6)
    print(f"{preview_path.relative_to(ROOT)}: {preview_path.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
