"""One-time script to convert existing PNG/JPG thumbnails to optimized WebP
and update the corresponding article JSON files."""

import os
import json
from PIL import Image

THUMBNAIL_SIZE = (384, 384)
WEBP_QUALITY = 80

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
THUMBNAILS_DIR = os.path.join(BASE_DIR, "..", "frontend", "public", "thumbnails")
NEWS_DIR = os.path.join(BASE_DIR, "..", "frontend", "public", "news")


def build_image_to_json_map():
    """Map image filenames referenced in article JSONs to their JSON file paths."""
    mapping = {}
    for fname in os.listdir(NEWS_DIR):
        if not fname.endswith(".json") or fname == "index.json":
            continue
        path = os.path.join(NEWS_DIR, fname)
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            img = data.get("image")
            if img:
                mapping[img] = path
        except Exception:
            pass
    return mapping


def main():
    image_to_json = build_image_to_json_map()

    converted = 0
    skipped = 0
    for fname in sorted(os.listdir(THUMBNAILS_DIR)):
        stem, ext = os.path.splitext(fname)
        if ext.lower() not in (".png", ".jpg", ".jpeg"):
            skipped += 1
            continue

        src = os.path.join(THUMBNAILS_DIR, fname)
        dst = os.path.join(THUMBNAILS_DIR, f"{stem}.webp")

        old_size = os.path.getsize(src)
        img = Image.open(src)
        img = img.resize(THUMBNAIL_SIZE, Image.LANCZOS)
        img.save(dst, "WEBP", quality=WEBP_QUALITY)
        new_size = os.path.getsize(dst)

        os.remove(src)

        new_fname = f"{stem}.webp"
        if fname in image_to_json:
            json_path = image_to_json[fname]
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            data["image"] = new_fname
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

        ratio = (1 - new_size / old_size) * 100
        print(f"  {fname} -> {new_fname}  ({old_size // 1024}KB -> {new_size // 1024}KB, -{ratio:.0f}%)")
        converted += 1

    print(f"\nDone: {converted} converted, {skipped} skipped.")


if __name__ == "__main__":
    main()
