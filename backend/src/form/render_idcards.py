#!/usr/bin/env python3
"""Render many member ID cards as a multi-page PDF.

Reads { cards: [ {…same fields as render_idcard…}, … ], resolution? } from stdin and writes a
multi-page PDF to stdout. Reuses render_card()/render_card_back() from render_idcard.py.

Layout: 1 card per page — front on one page, back on the next, serially for each member.
Each page is the exact card size (same as the single-member ID card PDF).
"""
import sys, io, json
from PIL import Image
from render_idcard import render_card, render_card_back


def main():
    data = json.load(sys.stdin)
    cards = data.get("cards") or []
    res = float(data.get("resolution") or 300)

    pages = []
    for card in cards:
        if not card:
            continue
        try:
            front = render_card(card)
            back = render_card_back(card)
        except Exception:
            continue
        pages.append(front)
        pages.append(back)

    if not pages:
        pages = [Image.new("RGB", (638, 1012), (255, 255, 255))]

    out = io.BytesIO()
    pages[0].save(out, format="PDF", resolution=res, save_all=True, append_images=pages[1:])
    sys.stdout.buffer.write(out.getvalue())


if __name__ == "__main__":
    main()
