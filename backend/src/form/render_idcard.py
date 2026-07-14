#!/usr/bin/env python3
"""Render a single member ID card (portrait CR80 badge, modern framed look) to stdout.

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
GREEN = (0, 112, 74)
GREEN_SOFT = (233, 244, 238)
RED = (211, 47, 47)
INK = (30, 34, 38)
MUTED = (108, 117, 122)
WHITE = (255, 255, 255)
BORDER = (218, 223, 220)
LIGHT = (236, 240, 238)

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


def _rounded(img, radius):
    m = Image.new("L", img.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, img.size[0] - 1, img.size[1] - 1), radius=radius, fill=255)
    r = img.convert("RGBA")
    r.putalpha(m)
    return r


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
            t = (cur + " " + w).strip()
            if measure(t, size) <= max_w or not cur:
                cur = t
            else:
                lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines

    # ---- Card frame ----
    d.rounded_rectangle((9, 9, W - 10, H - 10), radius=34, outline=GREEN, width=3)

    # ---- Header (rounded top) ----
    d.rounded_rectangle((12, 12, W - 12, 198), radius=31, corners=(True, True, False, False), fill=GREEN)
    dia = 108
    cx0, cy0 = 34, 40
    d.ellipse((cx0, cy0, cx0 + dia, cy0 + dia), fill=WHITE)
    lg = _load_logo()
    if lg is not None:
        lg2 = lg.copy()
        lg2.thumbnail((dia - 14, dia - 14), Image.LANCZOS)
        im.paste(lg2, (cx0 + (dia - lg2.width) // 2, cy0 + (dia - lg2.height) // 2), lg2)
    org = data.get("org_name") or "নাঙ্গলকোট বাজার ব্যবসায়ী সংস্থা"
    osz = 25
    lines = wrap(org, W - 185, osz)
    if len(lines) > 2:
        osz = 22
        lines = wrap(org, W - 185, osz)[:2]
    tcx = (162 + (W - 24)) / 2
    ty = 82 if len(lines) == 1 else 70
    for ln in lines:
        draw_center(tcx, ty, ln, osz, WHITE)
        ty += osz + 8
    draw_center(W / 2, 182, "সদস্য পরিচয়পত্র", 21, (214, 236, 225))

    # ---- Photo (rounded, green ring) ----
    PW, PH = 232, 286
    px, py = (W - PW) // 2, 222
    d.rounded_rectangle((px - 7, py - 7, px + PW + 7, py + PH + 7), radius=24, fill=GREEN)
    photo_b64 = data.get("photo_b64")
    done = False
    if photo_b64:
        try:
            pim = ImageOps.fit(
                Image.open(io.BytesIO(base64.b64decode(photo_b64))).convert("RGB"),
                (PW, PH), method=Image.LANCZOS,
            )
            r = _rounded(pim, 18)
            im.paste(r, (px, py), r)
            done = True
        except Exception:
            done = False
    if not done:
        chip = Image.new("RGB", (PW, PH), LIGHT)
        ImageDraw.Draw(chip).text(
            (PW / 2, PH / 2 + 42), ((data.get("full_name") or "?").strip()[:1] or "?"),
            font=font_bn(120), fill=GREEN, anchor="ms",
        )
        r = _rounded(chip, 18)
        im.paste(r, (px, py), r)

    # ---- ID (light-green pill) ----
    idtext = "NBA-" + str(data.get("six_digit_id") or "")
    idf = font_lat(29)
    idw = idf.getlength(idtext)
    pill_w = idw + 46
    d.rounded_rectangle((W / 2 - pill_w / 2, 522, W / 2 + pill_w / 2, 568), radius=23, fill=GREEN_SOFT)
    d.text((W / 2 - idw / 2, 557), idtext, font=idf, fill=GREEN, anchor="ls")

    # ---- Name + accent underline ----
    name = (data.get("full_name") or "").strip()
    y = 606
    if name:
        draw_center(W / 2, y, name, fit_size(name, W - 72, 33, 22), INK)
        d.rounded_rectangle((W / 2 - 44, y + 13, W / 2 + 44, y + 16), radius=2, fill=GREEN)
        y += 46

    # ---- Business type + mobile ----
    biz = (data.get("business_type") or "").strip()
    if biz:
        draw_center(W / 2, y, biz, fit_size(biz, W - 84, 24, 18), (70, 70, 70))
        y += 38
    mob = data.get("mobile_number")
    if mob:
        draw_center(W / 2, y, "মোবাইল: " + bn(mob), 22, (70, 70, 70))
        y += 42

    # ---- Blood group pill ----
    blood = (data.get("blood_group") or "").strip()
    if blood:
        label = "রক্তের গ্রুপ  " + blood
        bw = measure(label, 22) + 46
        d.rounded_rectangle((W / 2 - bw / 2, y, W / 2 + bw / 2, y + 44), radius=22, fill=RED)
        draw_center(W / 2, y + 30, label, 22, WHITE)
        y += 54

    # ---- QR (rounded white box) ----
    qr_b64 = data.get("qr_b64")
    avail_top, avail_bot = y + 6, H - 30
    QS = int(max(150, min(178, (avail_bot - avail_top) - 40)))
    box = QS + 24
    qy = int(avail_top + max(0, (avail_bot - avail_top - (box + 26)) / 2))
    bx = (W - box) // 2
    d.rounded_rectangle((bx, qy, bx + box, qy + box), radius=16, fill=WHITE, outline=BORDER, width=2)
    if qr_b64:
        try:
            qr = Image.open(io.BytesIO(base64.b64decode(qr_b64))).convert("RGB").resize((QS, QS), Image.NEAREST)
            im.paste(qr, (bx + 12, qy + 12))
        except Exception:
            pass
    draw_center(W / 2, qy + box + 22, "স্ক্যান করে ফরম দেখুন", 16, MUTED)
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
