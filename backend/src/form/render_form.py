#!/usr/bin/env python3
"""Render a member's registration form as a PDF.

Reads a JSON object (a businessman record + optional base64 photo) from stdin and writes the
filled PDF to stdout. The background is the association's official form (form-bg.png, 1241x1755
== A4 @ 150dpi); we overlay only the member's data using Noto Serif Bengali (a close match to the
form's traditional Bangla font).

Coordinates were measured off the form image rather than eyeballed: the dotted fill-in lines are
detected as short marks sitting on each baseline, which gives both the row's y and the x span
available for the value. FIELDS therefore stores each blank's real start/end, and text is placed
at start + PAD and shrunk if it would run past the end into the next label.

form-source.pdf is the master artwork (vector text, so it re-renders cleanly at any DPI).
To regenerate the background after the form is redesigned:

    pdftoppm -png -r 150 form-source.pdf out && mv out-1.png form-bg.png

then re-measure the dotted lines, because the row spacing and blank spans will have moved.
"""
import sys, os, io, json, base64
from PIL import Image, ImageDraw, ImageFont, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
BG = os.path.join(HERE, "form-bg.png")
FONT_BN = os.path.join(HERE, "fonts", "NotoSerifBengali-SemiBold.ttf")
FONT_LAT = os.path.join(HERE, "fonts", "DejaVuSans.ttf")

SIZE = 26          # preferred size; shrinks per-field only when the value would overflow
MIN_SIZE = 15
PAD = 10           # gap between where the dots start and where the value begins
TAIL = 6           # keep the value clear of the blank's right end
INK = (20, 20, 20)

# Baseline of each dotted line, top to bottom. Lines sit ~40.4px apart on this form; the
# values are the measured peaks, and text is lifted 4px so it rests on the line.
ROW_Y = [604, 645, 685, 725, 766, 806, 846, 886, 926, 967, 1007, 1048]
LIFT = 4

# (row, blank_x_start, blank_x_end, data key)
FIELDS = [
    (1,  190,  710, "full_name"),
    (1,  832, 1084, "mobile_number"),
    (2,  173,  584, "father_name"),
    (2,  696, 1087, "mother_name"),
    (3,  234,  590, "village"),
    (3,  671, 1076, "post_office"),
    (4,  237,  497, "municipality_or_union"),
    (4,  585,  852, "upazila"),
    (4,  915, 1077, "district"),
    (5,  359, 1068, "current_business_name_address"),
    (6,  193,  827, "business_type"),          # "ভোটারের ধরণঃ ব্যবসায়ী" is preprinted after this
    (7,  230,  490, "trade_license_no"),
    (7,  610, 1061, "tin_no"),
    (8,  202,  607, "market_name"),
    (8,  750, 1085, "owner_name"),
    (9,  247,  521, "ward_no"),
    (9,  721, 1084, "holding_no"),
    (10, 266,  719, "nid_no"),
    (10, 825, 1084, "blood_group"),
    (11, 187,  737, "nominee_name"),
    (11, 804, 1084, "nominee_relation"),
    (12, 259,  656, "nominee_mobile"),
]

ID_POS = (192, 537)                 # value for "আইডি নং:-"
PHOTO_BOX = (981, 341, 230, 219)    # x, y, w, h — inside the "ছবি ২কপি" rules

_BN = {"0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪", "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯"}
_FONTS = {}


def bn(v):
    if v is None:
        return ""
    return "".join(_BN.get(c, c) for c in str(v))


def is_latin(c):
    return ("A" <= c <= "Z") or ("a" <= c <= "z")


def font(latin, size):
    key = (latin, size)
    if key not in _FONTS:
        _FONTS[key] = (
            ImageFont.truetype(FONT_LAT, size)
            if latin
            else ImageFont.truetype(FONT_BN, size, layout_engine=ImageFont.Layout.RAQM)
        )
    return _FONTS[key]


def runs(text):
    """Split into Latin / non-Latin runs so each is drawn with a font that can shape it."""
    out, i = [], 0
    while i < len(text):
        lat = is_latin(text[i])
        j = i
        while j < len(text) and is_latin(text[j]) == lat:
            j += 1
        out.append((text[i:j], lat))
        i = j
    return out


def main():
    data = json.load(sys.stdin)
    im = Image.open(BG).convert("RGB")
    d = ImageDraw.Draw(im)

    def width(parts, size):
        return sum(d.textlength(t, font=font(lat, size)) for t, lat in parts)

    def draw_fit(x, y, text, max_w):
        """Draw at the largest size (up to SIZE) that keeps the value inside its blank."""
        if not text:
            return
        parts = runs(text)
        size = SIZE
        while size > MIN_SIZE and width(parts, size) > max_w:
            size -= 1
        cx = x
        for t, lat in parts:
            f = font(lat, size)
            d.text((cx, y), t, fill=INK, font=f, anchor="ls")
            cx += d.textlength(t, font=f)

    g = lambda k: data.get(k) or ""

    six = g("six_digit_id")
    if six:
        draw_fit(ID_POS[0], ID_POS[1], bn("NBA-" + str(six)), 520)

    for row, x0, x1, key in FIELDS:
        value = bn(g(key))
        if value:
            draw_fit(x0 + PAD, ROW_Y[row - 1] - LIFT, value, x1 - x0 - PAD - TAIL)

    photo_b64 = data.get("photo_b64")
    if photo_b64:
        try:
            pim = Image.open(io.BytesIO(base64.b64decode(photo_b64))).convert("RGB")
            px, py, pw, ph = PHOTO_BOX
            im.paste(ImageOps.fit(pim, (pw, ph), method=Image.LANCZOS), (px, py))
        except Exception:
            pass

    out = io.BytesIO()
    if (data.get("format") or "pdf").lower() == "png":
        im.save(out, format="PNG")
    else:
        im.save(out, format="PDF", resolution=150.0)
    sys.stdout.buffer.write(out.getvalue())


if __name__ == "__main__":
    main()
