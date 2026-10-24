"""Copy lossless, full-resolution room PNGs into the runtime asset folder."""

import json
import shutil
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "basics" / "assets" / "room" / "dark_rose"
OUTPUT = ROOT / "public" / "room" / "layers"
MANIFEST = ROOT / "src" / "room" / "roomLayers.json"


def png_size(path: Path) -> tuple[int, int]:
    with path.open("rb") as stream:
        header = stream.read(24)
    if len(header) != 24 or header[:8] != b"\x89PNG\r\n\x1a\n" or header[12:16] != b"IHDR":
        raise ValueError(f"{path}: expected a valid PNG file")
    return struct.unpack(">II", header[16:24])


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    layers = json.loads(MANIFEST.read_text(encoding="utf-8"))
    for layer in layers:
        if "crop" in layer or "clipBelowLine" in layer:
            raise ValueError(f"{layer['id']}: crop metadata is no longer supported")
        _, _, width, height = layer["target"]
        source_path = SOURCE / layer["source"]
        source_width, source_height = png_size(source_path)
        if source_width < width or source_height < height:
            raise ValueError(
                f"{source_path}: expected at least {width} x {height} pixels, got "
                f"{source_width} x {source_height}. Keep a full-resolution source."
            )
        destination = OUTPUT / layer["file"]
        shutil.copyfile(source_path, destination)
        print(f"{destination.relative_to(ROOT)}: {destination.stat().st_size:,} bytes")

    try:
        from PIL import Image
    except ImportError:
        print("Pillow is not installed; runtime PNGs were copied, layout preview was not rebuilt.")
    else:
        preview = Image.new("RGBA", (1536, 1024))
        for layer in layers:
            with Image.open(OUTPUT / layer["file"]) as image:
                _, _, width, height = layer["target"]
                display_layer = image.convert("RGBA").resize((width, height), Image.Resampling.LANCZOS)
                preview.alpha_composite(display_layer, tuple(layer["target"][:2]))
        preview_path = SOURCE / "current_layout_preview.webp"
        preview.convert("RGB").save(preview_path, "WEBP", quality=92, method=6)
        print(f"{preview_path.relative_to(ROOT)}: {preview_path.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()
