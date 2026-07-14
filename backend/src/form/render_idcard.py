#!/usr/bin/env python3
"""Render a single member ID card (portrait CR80 badge) and write it to stdout.

Reads a JSON member object from stdin: { format?, six_digit_id, full_name, business_type,
mobile_number, blood_group, photo_b64, qr_b64 }. Renders with Pillow + RAQM (Bangla shaping)
and writes a PDF (default) or PNG (format:"png", used for quick visual verification).
`render_card(data) -> PIL.Image` is imported by render_idcards.py for the bulk grid.
"""
import sys, os, io, json, base64
from PIL import Image, ImageDraw, ImageFont, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
FONT_BN = os.path.join(HERE, "fonts", "NotoSerifBengali-SemiBold.ttf")
FONT_LAT = os.path.join(HERE, "fonts", "DejaVuSans.ttf")
LOGO = os.path.join(HERE, "bazar-logo.png")

# Portrait CR80 card @ 300 dpi (54 x 85.6 mm).
W, H = 638, 1012
GREEN = (0, 106, 78)
GREEN_DK = (0, 84, 62)
RED = (213, 43, 50)
INK = (28, 28, 28)
MUTED = (90, 90, 90)
WHITE = (255, 255, 255)
LINE = (208, 208, 208)
LIGHT = (238, 242, 240)

_BN = {"0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪", "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯"}
_FONTS = {}


def bn(v):
    return "" if v is None else "".join(_BN.get(c, c) for c in str(v))


def font_bn(size):
    k = ("bn", size)
    if k not in _FONTS:
        _FONTS[k] = ImageFont.truetype(FONT_BN, size, layout_engine=ImageFont.Layout.RAQM)
    return _FONTS[k]


def font_lat(size):
    k = ("lat", size)
    if k not in _FONTS:
        _FONTS[k] = ImageFont.truetype(FONT_LAT, size)
    return _FONTS[k]


def _runs(text):
    """Yield (segment, is_latin) so Latin (A-Z/a-z) uses DejaVu and the rest uses the Bangla font."""
    is_l = lambda c: ("A" <= c <= "Z") or ("a" <= c <= "z")
    i = 0
    while i < len(text):
        lat = is_l(text[i])
        j = i
        while j < len(text) and is_l(text[j]) == lat:
            j += 1
        yield text[i:j], lat
        i = j


def measure(text, size):
    return sum((font_lat(size) if lat else font_bn(size)).getlength(run) for run, lat in _runs(text))


def fit_size(text, max_w, base, minimum):
    s = base
    while s > minimum and measure(text, s) > max_w:
        s -= 1
    return s


def _load_logo():
    try:
        lg = Image.open(LOGO).convert("RGBA")
        return lg
    except Exception:
        return None


def render_card(data):
    im = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(im)

    def draw_left(x, y, text, size, fill):
        cx = x
        for run, lat in _runs(text):
            f = font_lat(size) if lat else font_bn(size)
            d.text((cx, y), run, font=f, fill=fill, anchor="ls")
            cx += f.getlength(run)

    def draw_center(cx, y, text, size, fill):
        draw_left(cx - measure(text, size) / 2, y, text, size, fill)

    def wrap(text, max_w, size):
        words, lines, cur = text.split(), [], ""
        for w in words:
            trial = (cur + " " + w).strip()
            if measure(trial, size) <= max_w or not cur:
                cur = trial
            else:
                lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines

    # ---- Header band ----
    d.rectangle((0, 0, W, 150), fill=GREEN)
    lg = _load_logo()
    if lg is not None:
        lg.thumbnail((104, 104), Image.LANCZOS)
        im.paste(lg, (20, 22), lg)
    org = data.get("org_name") or "নাঙ্গলকোট বাজার ব্যবসায়ী সংস্থা"
    org_size = 25
    lines = wrap(org, W - 150, org_size)
    if len(lines) > 2:  # keep to 2 lines
        org_size = fit_size(org, (W - 150) * 2, 25, 18)
        lines = wrap(org, W - 150, org_size)[:2]
    ty = 62 if len(lines) == 1 else 52
    for ln in lines:
        draw_center((138 + W) / 2, ty, ln, org_size, WHITE)
        ty += org_size + 8
    # subtitle strip
    d.rectangle((0, 150, W, 196), fill=GREEN_DK)
    draw_center(W / 2, 181, "সদস্য পরিচয়পত্র", 23, WHITE)

    # ---- Photo ----
    PW, PH = 244, 288
    px = (W - PW) // 2
    py = 214
    d.rectangle((px - 2, py - 2, px + PW + 2, py + PH + 2), outline=LINE, width=3)
    photo_b64 = data.get("photo_b64")
    pasted = False
    if photo_b64:
        try:
            pim = Image.open(io.BytesIO(base64.b64decode(photo_b64))).convert("RGB")
            pim = ImageOps.fit(pim, (PW, PH), method=Image.LANCZOS)
            im.paste(pim, (px, py))
            pasted = True
        except Exception:
            pasted = False
    if not pasted:
        d.rectangle((px, py, px + PW, py + PH), fill=LIGHT)
        name = (data.get("full_name") or "?").strip()
        draw_center(W / 2, py + PH / 2 + 30, name[:1] or "?", 120, GREEN)

    # ---- Member ID ----
    idtext = "NBA-" + str(data.get("six_digit_id") or "")
    idf = font_lat(31)
    d.text((W / 2 - idf.getlength(idtext) / 2, 554), idtext, font=idf, fill=GREEN, anchor="ls")

    # ---- Name ----
    name = (data.get("full_name") or "").strip()
    if name:
        ns = fit_size(name, W - 60, 33, 22)
        draw_center(W / 2, 600, name, ns, INK)

    # ---- Business type + mobile ----
    y = 640
    biz = (data.get("business_type") or "").strip()
    if biz:
        draw_center(W / 2, y, biz, fit_size(biz, W - 70, 25, 18), (55, 55, 55))
        y += 38
    mob = data.get("mobile_number")
    if mob:
        draw_center(W / 2, y, "মোবাইল: " + bn(mob), 23, (55, 55, 55))
        y += 42

    # ---- Blood group badge ----
    blood = (data.get("blood_group") or "").strip()
    if blood:
        label = "রক্তের গ্রুপ:  " + blood
        bw = measure(label, 23) + 44
        bx0 = W / 2 - bw / 2
        by0 = y
        d.rounded_rectangle((bx0, by0, bx0 + bw, by0 + 46), radius=23, fill=RED)
        draw_center(W / 2, by0 + 32, label, 23, WHITE)
        y = by0 + 56

    # ---- QR (centered in remaining space; size adapts so the caption is never clipped) ----
    qr_b64 = data.get("qr_b64")
    avail_top, avail_bot = y + 8, H - 16
    QS = int(max(150, min(178, (avail_bot - avail_top) - 30)))
    qx = (W - QS) // 2
    block_h = QS + 30
    qy = int(avail_top + max(0, (avail_bot - avail_top - block_h) / 2))
    if qr_b64:
        try:
            qr = Image.open(io.BytesIO(base64.b64decode(qr_b64))).convert("RGB").resize((QS, QS), Image.NEAREST)
            d.rectangle((qx - 2, qy - 2, qx + QS + 2, qy + QS + 2), outline=LINE, width=2)
            im.paste(qr, (qx, qy))
        except Exception:
            pass
    draw_center(W / 2, qy + QS + 26, "স্ক্যান করে ফরম দেখুন", 17, MUTED)

    # footer accent
    d.rectangle((0, H - 8, W, H), fill=GREEN)
    return im


def main():
    data = json.load(sys.stdin)
    im = render_card(data)
    out = io.BytesIO()
    if (data.get("format") or "pdf").lower() == "png":
        im.save(out, format="PNG")
    else:
        im.save(out, format="PDF", resolution=300.0)
    sys.stdout.buffer.write(out.getvalue())


if __name__ == "__main__":
    main()
