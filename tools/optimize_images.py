"""Generate web-ready images for the portfolio.

Usage (from the repo root):  python tools/optimize_images.py

Reads full-size photos from assets/photos/originals/ (git-ignored) and the
existing project images in assets/, and writes resized WebP files to
assets/img/. EXIF metadata (including GPS) is dropped because Pillow does not
copy it unless asked to.
"""
from pathlib import Path

from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = None  # the suit headshot is ~100 MP

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "photos" / "originals"
OUT = ROOT / "assets" / "img"
OUT.mkdir(parents=True, exist_ok=True)


def load(path):
    return ImageOps.exif_transpose(Image.open(path)).convert("RGB")


def crop_frac(im, left, top, right, bottom):
    w, h = im.size
    return im.crop((round(left * w), round(top * h), round(right * w), round(bottom * h)))


def crop_ratio(im, ratio, cx=0.5, cy=0.5):
    """Largest crop with width/height == ratio, centred near (cx, cy)."""
    w, h = im.size
    if w / h > ratio:
        nw, nh = round(h * ratio), h
    else:
        nw, nh = w, round(w / ratio)
    x = min(max(round(cx * w - nw / 2), 0), w - nw)
    y = min(max(round(cy * h - nh / 2), 0), h - nh)
    return im.crop((x, y, x + nw, y + nh))


def save_widths(im, name, widths, quality=78):
    # Widths larger than the source are clamped to the source width (no upscaling).
    for w in sorted({min(w, im.width) for w in widths}):
        h = round(im.height * w / im.width)
        im.resize((w, h), Image.LANCZOS).save(OUT / f"{name}-{w}.webp", "WEBP", quality=quality, method=6)
        print(f"{name}-{w}.webp  {w}x{h}")


# Hero: rooftop, kept at its native 3:4 portrait ratio.
rooftop = load(SRC / "rooftop.jpg")
save_widths(rooftop, "rooftop", [480, 800, 1200, 1600])

# About: suit headshot, 4:5 head-and-shoulders.
suit = load(SRC / "headshot-suit.jpg")
save_widths(crop_ratio(suit, 4 / 5, cy=0.42), "headshot", [320, 640])

# Open Graph / Twitter card: 1200x630 JPEG (broadest crawler support).
og = crop_ratio(suit, 1200 / 630, cy=0.36).resize((1200, 630), Image.LANCZOS)
og.save(OUT / "og-image.jpg", "JPEG", quality=82, optimize=True, progressive=True)
print("og-image.jpg  1200x630")

# Touch icon: square crop of the face.
crop_ratio(suit, 1, cy=0.3).resize((180, 180), Image.LANCZOS).save(
    ROOT / "apple-touch-icon.png", "PNG", optimize=True)
print("apple-touch-icon.png  180x180")

# Research: poster session, cropped below the projector screen.
poster = crop_frac(load(SRC / "poster.jpg"), 0, 0.17, 1, 1)
save_widths(crop_ratio(poster, 4 / 5, cx=0.6, cy=0), "poster", [480, 800, 1200])

# Experience and project images: 16:10 so the grid lines up.
for src, name in [
    ("oct.png", "oct"),
    ("securecomm.png", "securecomm"),
    ("web.jpeg", "portfolio"),
    ("gol.png", "game-of-life"),
    ("mess.jpg", "messenger"),
    ("malloc3.png", "allocator"),
    ("medlib2.png", "media-library"),
]:
    im = crop_ratio(load(ROOT / "assets" / src), 16 / 10)
    save_widths(im, name, [480, 960])
