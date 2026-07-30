#!/usr/bin/env python3
"""
Render every page of a PDF to a PNG image AND extract its text layer, then
write a manifest describing each page. This is the deterministic front-half of
a contradiction audit: it gets the whole document into a form Claude can read
both ways — the text for fast scanning of prose/numbers, and the page image so
charts, tables, and figures are actually *seen* rather than guessed at from a
mangled text layer.

Usage:
    python pdf_to_pages.py INPUT.pdf OUTPUT_DIR [--dpi 150] [--max-px 2200]

Outputs, inside OUTPUT_DIR/:
    page-001.png, page-002.png, ...   rendered page images
    page-001.txt, page-002.txt, ...   extracted text per page
    manifest.json                     one record per page (see below)

Each manifest record:
    {
      "page": 1,                  # 1-indexed, matches what a human sees
      "image": "page-001.png",
      "text_file": "page-001.txt",
      "word_count": 312,
      "has_raster_images": true,  # embedded photos/chart images present
      "has_vector_drawings": true,# vector graphics (native charts/lines) present
      "likely_has_visuals": true  # either of the above -> inspect the image closely
    }

Dependencies: PyMuPDF (`pip install pymupdf`). Nothing system-level (no poppler).
"""
import argparse
import json
import os
import sys


def main():
    ap = argparse.ArgumentParser(description="Render PDF pages to images + text for a contradiction audit.")
    ap.add_argument("pdf", help="path to the input PDF")
    ap.add_argument("out_dir", help="directory to write images, text, and manifest.json")
    ap.add_argument("--dpi", type=int, default=150,
                    help="render resolution. 150 keeps chart/table labels legible without huge files; "
                         "bump to 200+ for dense tables or fine print (default: 150)")
    ap.add_argument("--max-px", type=int, default=2200,
                    help="cap the longest image edge in pixels; oversized pages are scaled down so a "
                         "single page image doesn't blow up token cost (default: 2200)")
    args = ap.parse_args()

    try:
        import fitz  # PyMuPDF
    except ImportError:
        sys.exit("PyMuPDF is required. Install it with:  pip install pymupdf")

    if not os.path.isfile(args.pdf):
        sys.exit(f"No such file: {args.pdf}")
    os.makedirs(args.out_dir, exist_ok=True)

    doc = fitz.open(args.pdf)
    manifest = []

    for i, page in enumerate(doc, start=1):
        base = f"page-{i:03d}"
        img_path = os.path.join(args.out_dir, base + ".png")
        txt_path = os.path.join(args.out_dir, base + ".txt")

        # Render. Start from the requested DPI, then downscale if the page is
        # physically large enough that DPI alone would exceed the pixel cap.
        zoom = args.dpi / 72.0
        rect = page.rect
        longest_pt = max(rect.width, rect.height)
        longest_px = longest_pt * zoom
        if longest_px > args.max_px:
            zoom *= args.max_px / longest_px
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom))
        pix.save(img_path)

        text = page.get_text("text")
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(text)

        has_raster = len(page.get_images(full=True)) > 0
        try:
            has_vector = len(page.get_drawings()) > 0
        except Exception:
            has_vector = False

        manifest.append({
            "page": i,
            "image": base + ".png",
            "text_file": base + ".txt",
            "word_count": len(text.split()),
            "has_raster_images": has_raster,
            "has_vector_drawings": has_vector,
            "likely_has_visuals": has_raster or has_vector,
        })

    with open(os.path.join(args.out_dir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump({"source_pdf": os.path.abspath(args.pdf),
                   "page_count": len(manifest),
                   "dpi": args.dpi,
                   "pages": manifest}, f, indent=2)

    visuals = sum(1 for p in manifest if p["likely_has_visuals"])
    print(f"Rendered {len(manifest)} page(s) to {args.out_dir}")
    print(f"{visuals} page(s) flagged as likely containing charts/tables/figures — inspect those images closely.")
    print(f"Manifest: {os.path.join(args.out_dir, 'manifest.json')}")


if __name__ == "__main__":
    main()
