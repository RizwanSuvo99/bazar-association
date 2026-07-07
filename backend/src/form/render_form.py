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
    fields = [
        (230, 588, bn("NBA-" + str(six))),
        (235, 660, bn(g("full_name"))),
        (880, 660, bn(g("mobile_number"))),
        (230, 694, bn(g("father_name"))),
        (770, 694, bn(g("mother_name"))),
        (335, 726, bn(g("village"))),
        (635, 726, bn(g("post_office"))),
        (975, 726, bn(g("municipality_or_union"))),
        (215, 760, bn(g("upazila"))),
        (665, 760, bn(g("district"))),
        (490, 794, bn(g("current_business_name_address"))),
        (245, 828, bn(g("business_type"))),
        (650, 828, bn(g("trade_license_no"))),
        (925, 828, bn(g("tin_no"))),
        (245, 862, bn(g("market_name"))),
        (780, 862, bn(g("owner_name"))),
        (310, 896, bn(g("ward_no"))),
        (690, 896, bn(g("holding_no"))),
        (340, 930, bn(g("nid_no"))),
        (905, 930, bn(g("blood_group"))),
        (255, 964, bn(g("nominee_name"))),
        (770, 964, bn(g("nominee_relation"))),
        (310, 998, bn(g("nominee_mobile"))),
    ]
    for x, y, text in fields:
        if text:
            draw(x, y, text)

    # Member photo in the "ছবি ২কপি" box.
    photo_b64 = data.get("photo_b64")
    if photo_b64:
        try:
            pim = Image.open(io.BytesIO(base64.b64decode(photo_b64))).convert("RGB")
            pim = ImageOps.fit(pim, (192, 232), method=Image.LANCZOS)
            im.paste(pim, (988, 366))
        except Exception:
            pass

    out = io.BytesIO()
    im.save(out, format="PDF", resolution=150.0)
    sys.stdout.buffer.write(out.getvalue())


if __name__ == "__main__":
    main()
