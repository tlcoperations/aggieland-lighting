#!/usr/bin/env python3
"""Turn a product photo into a tight, transparent PNG cutout for /preview/.

Run by hand on your own computer. It is NOT part of the Render build.

Setup (once):
    python3 -m venv .venv-preview && source .venv-preview/bin/activate
    pip install -r scripts/preview/requirements.txt

Use:
    python3 scripts/preview/make_cutout.py ~/Downloads/chandelier.jpg \
        --id acme-aria-chandelier --width-in 28 --height-in 30

What it does:
  1. Removes the background with rembg (free, open source, runs offline after the
     first run downloads its model, roughly 180 MB, to ~/.rembg).
  2. Crops the transparent margin so the PNG touches the fixture on all four sides.
     This matters: the page scales the PNG to exactly widthIn x heightIn.
  3. Shrinks it to at most 1400 px on the long side.
  4. Saves src/images/preview/<id>.png and prints the data entry to paste into
     src/_data/previewFixtures.json, plus a warning if the picture's shape does not
     match the width and height you typed.

Always open the PNG and check it before you commit it. Glass and crystal often
need touch-ups in an image editor. If the photo already has a transparent
background, add --no-rembg to only crop and resize.
"""
import argparse
import json
import sys
from pathlib import Path

from PIL import Image

OUT = Path(__file__).resolve().parents[2] / "src" / "images" / "preview"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("image", help="product photo (jpg/png/webp)")
    ap.add_argument("--id", required=True, help="lowercase-with-dashes id, also the output file name")
    ap.add_argument("--width-in", type=float, required=True, help="fixture width in inches, from the listing")
    ap.add_argument("--height-in", type=float, required=True, help="fixture height in inches (body as pictured)")
    ap.add_argument("--name", default="", help="product name for the printed entry")
    ap.add_argument("--brand", default="", help="brand for the printed entry")
    ap.add_argument("--max-px", type=int, default=1400, help="longest side of the saved PNG (default 1400)")
    ap.add_argument("--model", default="isnet-general-use",
                    help="rembg model (default isnet-general-use, Apache-2.0). Avoid the bria-* models: non-commercial license")
    ap.add_argument("--no-rembg", action="store_true", help="skip background removal (image is already transparent)")
    args = ap.parse_args()

    img = Image.open(args.image).convert("RGBA")
    if not args.no_rembg:
        try:
            from rembg import new_session, remove
        except ImportError:
            sys.exit("rembg is not installed. Run: pip install -r scripts/preview/requirements.txt")
        img = remove(img, session=new_session(args.model))

    bbox = img.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    if not bbox:
        sys.exit("Nothing left after background removal. Try a cleaner photo, or edit the PNG by hand.")
    img = img.crop(bbox)

    if max(img.size) > args.max_px:
        scale = args.max_px / max(img.size)
        img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)

    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / f"{args.id}.png"
    img.save(dest, optimize=True)
    print(f"Saved {dest.relative_to(OUT.parents[2])} ({img.width}x{img.height}px). Open it and check the edges.")

    want = args.width_in / args.height_in
    got = img.width / img.height
    if abs(got / want - 1) > 0.03:
        print(f"\nWARNING: the cutout is {got:.2f}:1 (wide:tall) but {args.width_in:g} x {args.height_in:g} in is {want:.2f}:1.")
        print("The fixture would look stretched. Usual causes: the listing height includes chain/rod that is not in")
        print("the photo (use the height of the fixture body as pictured), or part of the fixture was cut off.")

    entry = {
        "id": args.id,
        "name": args.name or "TODO product name",
        "brand": args.brand or "TODO brand",
        "catalogUrl": "https://TODO-link-to-the-listing",
        "cutout": f"/images/preview/{args.id}.png",
        "widthIn": args.width_in,
        "heightIn": args.height_in,
    }
    print("\nAdd this to src/_data/previewFixtures.json (and fill in the TODOs):\n")
    print(json.dumps(entry, indent=2))


if __name__ == "__main__":
    main()
