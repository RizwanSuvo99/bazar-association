#!/usr/bin/env python3
"""Render a single member ID card (portrait badge) to stdout.

Reads a JSON member object from stdin: { format?, six_digit_id, full_name, business_type,
mobile_number, blood_group, photo_b64, qr_b64 }. Renders with Pillow + RAQM (Bangla shaping)
and writes a PDF (default) or PNG (format:"png"). `render_card(data) -> PIL.Image` is imported
by render_idcards.py for the bulk grid.
"""
import sys, os, io, json, base64
from PIL import Image, ImageDraw, ImageFont, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
FONT_BN = os.path.join(HERE, "fonts", "NotoSerifBengali-SemiBold.ttf")
FONT_LAT = os.path.join(HERE, "fonts", "DejaVuSans.ttf")
LOGO = os.path.join(HERE, "bazar-logo.png")

# Portrait CR80 card @ 300 dpi (54 x 85.6 mm).
W, H = 638, 1012
# Olive / lime palette (cohesive green scheme).
DARK = (84, 101, 51)     # header / footer / title pill
MID = (127, 158, 88)     # photo ring
BODY = (238, 246, 206)   # card body (pale lime)
NAME_C = (74, 92, 46)    # name + labels (dark olive)
VALUE_C = (58, 58, 44)   # detail values
WHITE = (255, 255, 255)
PLACEHOLDER = (223, 231, 198)

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
        return Image.open(LOGO).convert("RGBA")
    except Exception:
        return None


def _circle(img, size):
    img = ImageOps.fit(img, (size, size), method=Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    r = img.convert("RGBA")
    r.putalpha(mask)
    return r


def render_card(data):
    im = Image.new("RGB", (W, H), BODY)
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
            t = (cur + " " + w).strip()
            if measure(t, size) <= max_w or not cur:
                cur = t
            else:
                lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines

    # ---- Curved green header (organic, left-biased lobe) ----
    d.rectangle((0, 0, W, 150), fill=DARK)
    d.ellipse((-250, -330, 602, 338), fill=DARK)

    # logo + association name (white)
    lg = _load_logo()
    if lg is not None:
        lg2 = lg.copy()
        lg2.thumbnail((66, 66), Image.LANCZOS)
        im.paste(lg2, ((W - lg2.width) // 2, 20), lg2)
    org = data.get("org_name") or "নাঙ্গলকোট বাজার ব্যবসায়ী সংস্থা"
    osz = 26
    lines = wrap(org, W - 80, osz)
    if len(lines) > 2:
        osz = 23
        lines = wrap(org, W - 80, osz)[:2]
    ty = 122 if len(lines) == 1 else 110
    for ln in lines:
        draw_center(W / 2, ty, ln, osz, WHITE)
        ty += osz + 8

    # ---- Circular photo (overlapping), with ring ----
    cxp, cyp, R = W // 2, 300, 130
    d.ellipse((cxp - R - 9, cyp - R - 9, cxp + R + 9, cyp + R + 9), fill=MID)
    ph = None
    if data.get("photo_b64"):
        try:
            ph = _circle(Image.open(io.BytesIO(base64.b64decode(data["photo_b64"]))).convert("RGB"), 2 * R)
        except Exception:
            ph = None
    if ph is None:
        chip = Image.new("RGB", (2 * R, 2 * R), PLACEHOLDER)
        ImageDraw.Draw(chip).text(
            (R, R + 48), ((data.get("full_name") or "?").strip()[:1] or "?"),
            font=font_bn(150), fill=DARK, anchor="ms",
        )
        ph = _circle(chip, 2 * R)
    im.paste(ph, (cxp - R, cyp - R), ph)

    # ---- Name ----
    name = (data.get("full_name") or "").strip()
    if name:
        draw_center(W / 2, 540, name, fit_size(name, W - 56, 44, 26), NAME_C)

    # ---- Title pill (business type) ----
    y = 566
    biz = (data.get("business_type") or "").strip()
    if biz:
        bs = fit_size(biz, W - 150, 26, 18)
        pw = measure(biz, bs) + 66
        d.rounded_rectangle((W / 2 - pw / 2, y, W / 2 + pw / 2, y + 50), radius=10, fill=DARK)
        draw_center(W / 2, y + 34, biz, bs, WHITE)
        y += 78
    else:
        y += 28

    # ---- Details (left-aligned label : value) ----
    lx, vx = 52, 226
    rows = [
        ("সদস্য আইডি", "NBA-" + str(data.get("six_digit_id") or "")),
        ("মোবাইল", bn(data.get("mobile_number"))),
        ("রক্তের গ্রুপ", (data.get("blood_group") or "").strip()),
    ]
    for label, val in rows:
        if not val:
            continue
        draw_left(lx, y + 27, label, 24, NAME_C)
        draw_left(vx, y + 27, ":  " + val, 24, VALUE_C)
        y += 46

    # ---- QR (centered, above the footer bar) ----
    qr_b64 = data.get("qr_b64")
    avail_top, avail_bot = y + 10, H - 64
    QS = int(max(150, min(180, avail_bot - avail_top)))
    qy = int(avail_top + max(0, (avail_bot - avail_top - QS) / 2))
    qx = (W - QS) // 2
    if qr_b64:
        try:
            qr = Image.open(io.BytesIO(base64.b64decode(qr_b64))).convert("RGB").resize((QS, QS), Image.NEAREST)
            im.paste(qr, (qx, qy))
        except Exception:
            pass

    # ---- Footer bar ----
    d.rectangle((0, H - 46, W, H), fill=DARK)
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
