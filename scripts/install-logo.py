"""Installs the project logo: crops the empty margin, writes public/logo.png and public/logo-white.png, makes the favicon
and app icons, and points index.html at them.

    python3 scripts/install-logo.py path/to/logo.png [path/to/logo-white.png]

With no arguments it uses public/logo.png and public/logo-white.png as they are (just save the files there and run it).
"""
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"


def tight(im: Image.Image, pad: float = 0.04) -> Image.Image:
    """Crop to what is drawn (the alpha channel, or anything not black) and pad it to a square."""
    im = im.convert("RGBA")
    a = im.getchannel("A")
    box = a.getbbox()
    if box is None or box == (0, 0, *im.size) and a.getextrema() == (255, 255):  # no transparency: use brightness
        box = im.convert("L").point(lambda v: 255 if v > 24 else 0).getbbox() or (0, 0, *im.size)
    im = im.crop(box)
    side = int(max(im.size) * (1 + pad * 2))
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(im, ((side - im.width) // 2, (side - im.height) // 2), im)
    return sq


def resized(im: Image.Image, n: int) -> Image.Image:
    return im.resize((n, n), Image.LANCZOS)


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else PUBLIC / "logo.png"
    white = Path(sys.argv[2]) if len(sys.argv) > 2 else PUBLIC / "logo-white.png"
    if not src.exists():
        sys.exit(f"{src} not found. Save the logo there (or pass its path) and run again.")
    color = tight(Image.open(src))
    color = resized(color, 1024) if color.width > 1024 else color
    color.save(PUBLIC / "logo.png", optimize=True)
    if white.exists():
        w = tight(Image.open(white))
        (resized(w, 1024) if w.width > 1024 else w).save(PUBLIC / "logo-white.png", optimize=True)
    resized(color, 32).save(PUBLIC / "favicon-32.png")
    resized(color, 192).save(PUBLIC / "icon-192.png")
    resized(color, 512).save(PUBLIC / "icon-512.png")
    # the iOS home-screen icon has no transparency: the logo on the page's dark color
    tile = Image.new("RGBA", (180, 180), (4, 7, 13, 255))
    inner = resized(color, 132)
    tile.paste(inner, (24, 24), inner)
    tile.convert("RGB").save(PUBLIC / "apple-touch-icon.png")

    html = (ROOT / "index.html").read_text()
    icons = (
        '    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />\n'
        '    <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />\n'
        '    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />\n'
    )
    html = re.sub(r'    <link rel="(?:icon|apple-touch-icon)"[^>]*>\n', "", html)
    html = html.replace('    <meta name="viewport"', icons + '    <meta name="viewport"', 1)
    (ROOT / "index.html").write_text(html)
    print("logo installed:", ", ".join(p.name for p in sorted(PUBLIC.glob("*.png"))))


if __name__ == "__main__":
    main()
