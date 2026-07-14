#!/usr/bin/env python3
"""Render a member's registration form as a PDF.

Reads a JSON object (a businessman record + optional base64 photo) from stdin and writes the
filled PDF to stdout. The background is the association's official form (form-bg.png, 1241x1755
== A4 @ 150dpi); we overlay only the member's data using Noto Serif Bengali (a close match to the
form's traditional Bangla font) at coordinates measured against the form image.
"""
import sys, os, io, json, base64
from PIL import Image, ImageDraw, ImageFont, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
BG = os.path.join(HERE, "form-bg.png")
FONT_BN = os.path.join(HERE, "fonts", "NotoSerifBengali-SemiBold.ttf")
FONT_LAT = os.path.join(HERE, "fonts", "DejaVuSans.ttf")
SIZE = 26

_BN = {"0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪", "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯"}


def bn(v):
    if v is None:
        return ""
    return "".join(_BN.get(c, c) for c in str(v))


def is_latin(c):
    return ("A" <= c <= "Z") or ("a" <= c <= "z")


def main():
    data = json.load(sys.stdin)
    im = Image.open(BG).convert("RGB")
    d = ImageDraw.Draw(im)
    fbn = ImageFont.truetype(FONT_BN, SIZE, layout_engine=ImageFont.Layout.RAQM)
    flat = ImageFont.truetype(FONT_LAT, SIZE)

    def draw(x, y, text):
        # Draw with baseline anchor; split Latin vs Bangla runs so both render correctly.
        i, cx = 0, x
        while i < len(text):
            lat = is_latin(text[i])
            j = i
            while j < len(text) and is_latin(text[j]) == lat:
                j += 1
            run = text[i:j]
            f = flat if lat else fbn
            d.text((cx, y), run, fill=(20, 20, 20), font=f, anchor="ls")
            cx += d.textlength(run, font=f)
            i = j

    g = lambda k: data.get(k) or ""
    six = g("six_digit_id")
    # Baselines follow the form's dotted lines: row r sits at 641 + 35*(r-1)
    # (the dotted lines are at 645 + 35*(r-1); we lift 4px so text rests just on the line).
    def row(r):
        return 641 + 35 * (r - 1)
    fields = [
        (230, 569, bn("NBA-" + str(six))),
        (235, row(1), bn(g("full_name"))),
        (880, row(1), bn(g("mobile_number"))),
        (230, row(2), bn(g("father_name"))),
        (770, row(2), bn(g("mother_name"))),
        (335, row(3), bn(g("village"))),
        (635, row(3), bn(g("post_office"))),
        (940, row(3), bn(g("municipality_or_union"))),
        (215, row(4), bn(g("upazila"))),
        (665, row(4), bn(g("district"))),
        (490, row(5), bn(g("current_business_name_address"))),
        (245, row(6), bn(g("business_type"))),
        (585, row(6), bn(g("trade_license_no"))),
        (925, row(6), bn(g("tin_no"))),
        (245, row(7), bn(g("market_name"))),
        (780, row(7), bn(g("owner_name"))),
        (310, row(8), bn(g("ward_no"))),
        (690, row(8), bn(g("holding_no"))),
        (340, row(9), bn(g("nid_no"))),
        (905, row(9), bn(g("blood_group"))),
        (255, row(10), bn(g("nominee_name"))),
        (858, row(10), bn(g("nominee_relation"))),
        (310, row(11), bn(g("nominee_mobile"))),
    ]
    for x, y, text in fields:
        if text:
            draw(x, y, text)

    # Member photo in the "ছবি ২কপি" box.
    photo_b64 = data.get("photo_b64")
    if photo_b64:
        try:
            pim = Image.open(io.BytesIO(base64.b64decode(photo_b64))).convert("RGB")
            # Fill the whole "ছবি" box (borders at left=980,top=371,right=1212,bottom=593).
            pim = ImageOps.fit(pim, (230, 220), method=Image.LANCZOS)
            im.paste(pim, (981, 372))
        except Exception:
            pass

    out = io.BytesIO()
    im.save(out, format="PDF", resolution=150.0)
    sys.stdout.buffer.write(out.getvalue())


if __name__ == "__main__":
    main()
