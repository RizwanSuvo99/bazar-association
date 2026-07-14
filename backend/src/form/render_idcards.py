#!/usr/bin/env python3
"""Render many member ID cards onto A4 sheets (a grid, with cut guides) as a multi-page PDF.

Reads { cards: [ {…same fields as render_idcard…}, … ], resolution? } from stdin and writes a
multi-page A4 PDF to stdout. Reuses render_card() from render_idcard.py. 3x3 = 9 cards per page.
"""
import sys, io, json
from PIL import Image, ImageDraw
from render_idcard import render_card, W, H

A4W, A4H = 2480, 3508           # A4 portrait @ 300 dpi
COLS, ROWS = 3, 3
COL_GAP, ROW_GAP = 60, 40
PER = COLS * ROWS
GRID_W = COLS * W + (COLS - 1) * COL_GAP
GRID_H = ROWS * H + (ROWS - 1) * ROW_GAP
MX = (A4W - GRID_W) // 2
MY = (A4H - GRID_H) // 2
TICK = 22
GREY = (185, 185, 185)


def cut_ticks(d, x, y):
    """Faint corner crop marks just outside each card for easy guillotine cutting."""
    for cx, cy, dx, dy in [(x, y, -1, -1), (x + W, y, 1, -1), (x, y + H, -1, 1), (x + W, y + H, 1, 1)]:
        d.line([(cx, cy), (cx + dx * TICK, cy)], fill=GREY, width=1)
        d.line([(cx, cy), (cx, cy + dy * TICK)], fill=GREY, width=1)


def main():
    data = json.load(sys.stdin)
    cards = data.get("cards") or []
    res = float(data.get("resolution") or 300)

    pages = []
    for i in range(0, len(cards), PER):
        page = Image.new("RGB", (A4W, A4H), (255, 255, 255))
        d = ImageDraw.Draw(page)
        for k, card in enumerate(cards[i:i + PER]):
            if not card:
                continue
            r, c = divmod(k, COLS)
            x = MX + c * (W + COL_GAP)
            y = MY + r * (H + ROW_GAP)
            try:
                cim = render_card(card)
            except Exception:
                continue
            page.paste(cim, (x, y))
            cut_ticks(d, x, y)
        pages.append(page)

    if not pages:
        pages = [Image.new("RGB", (A4W, A4H), (255, 255, 255))]

    out = io.BytesIO()
    pages[0].save(out, format="PDF", resolution=res, save_all=True, append_images=pages[1:])
    sys.stdout.buffer.write(out.getvalue())


if __name__ == "__main__":
    main()
