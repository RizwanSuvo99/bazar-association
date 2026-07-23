#!/usr/bin/env python3
"""Render many member ID cards onto A4 sheets as a multi-page PDF.

Reads { cards: [ {…same fields as render_idcard…}, … ], resolution? } from stdin and writes a
multi-page A4 PDF to stdout. Reuses render_card()/render_card_back() from render_idcard.py.

Layout: 3 members per page, one row each, with that member's FRONT and BACK side by side —
so a print shop can cut each pair and glue/laminate it back-to-back. Corner cut ticks are
drawn around every card.
"""
import sys, io, json
from PIL import Image, ImageDraw
from render_idcard import render_card, render_card_back, W, H

A4W, A4H = 2480, 3508           # A4 portrait @ 300 dpi
ROWS = 3                        # members per page
PAIR_GAP = 56                   # gap between a member's front and back
ROW_GAP = 48
PAIR_W = 2 * W + PAIR_GAP
GRID_H = ROWS * H + (ROWS - 1) * ROW_GAP
MX = (A4W - PAIR_W) // 2
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
    for i in range(0, len(cards), ROWS):
        page = Image.new("RGB", (A4W, A4H), (255, 255, 255))
        d = ImageDraw.Draw(page)
        for k, card in enumerate(cards[i:i + ROWS]):
            if not card:
                continue
            y = MY + k * (H + ROW_GAP)
            try:
                front = render_card(card)
                back = render_card_back(card)
            except Exception:
                continue
            page.paste(front, (MX, y))
            cut_ticks(d, MX, y)
            page.paste(back, (MX + W + PAIR_GAP, y))
            cut_ticks(d, MX + W + PAIR_GAP, y)
        pages.append(page)

    if not pages:
        pages = [Image.new("RGB", (A4W, A4H), (255, 255, 255))]

    out = io.BytesIO()
    pages[0].save(out, format="PDF", resolution=res, save_all=True, append_images=pages[1:])
    sys.stdout.buffer.write(out.getvalue())


if __name__ == "__main__":
    main()
