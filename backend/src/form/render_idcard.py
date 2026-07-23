#!/usr/bin/env python3
"""Render a member ID card (front + back) to stdout.

Reads a JSON member object from stdin: { format?, side?, six_digit_id, full_name,
business_type, mobile_number, blood_group, photo_b64, qr_b64, org_name? }.
Renders with Pillow + RAQM (Bangla shaping). Default output is a 2-page PDF
(front, back). With format:"png" a single side is emitted (side:"back" for the back,
else the front). `render_card(data)` / `render_card_back(data)` return PIL images and
are imported by render_idcards.py for the bulk grid.
"""
import sys, os, io, json, base64
from PIL import Image, ImageDraw, ImageFont, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
FONT_BN = os.path.join(HERE, "fonts", "NotoSerifBengali-SemiBold.ttf")
FONT_LAT = os.path.join(HERE, "fonts", "DejaVuSans.ttf")
LOGO = os.path.join(HERE, "bazar-logo.png")
LOGO_HD = os.path.join(HERE, "bazar-logo-hd.png")   # crisper, transparent-bg logo for the back

# Portrait CR80 card @ 300 dpi (54 x 85.6 mm).
W, H = 638, 1012
# Navy / blue palette.
DARK = (26, 48, 86)      # header / footer / pill (deep navy)
MID = (66, 118, 180)     # photo ring (medium blue)
BODY = (233, 240, 250)   # card body (pale blue)
NAME_C = (26, 48, 86)    # name + labels (navy)
VALUE_C = (52, 58, 72)   # detail values
WHITE = (255, 255, 255)
PLACEHOLDER = (210, 222, 240)
BLUE = (37, 99, 210)
RED = (200, 32, 40)      # blood-drop icon

# Fixed association info (overridable via payload).
ORG_NAME = "নাঙ্গলকোট বাজার ব্যবসায়ী সংস্থা"
OFFICE_ADDR = "অফিসঃ নাঙ্গলকোট মধ্য বাজার, নাঙ্গলকোট, কুমিল্লা"
OFFICE_PHONE = "ফোনঃ ০১৩৩৩০৮৭১৮০"
NOTES = [
    "এই কার্ডটি হস্তান্তরযোগ্য নয় ও সংস্থার সম্পত্তি।",
    "পাওয়া গেলে অনুগ্রহ করে সংস্থার অফিসে জমা দিন।",
]
# Authorising officials (signature asset, name, role) — from the registration form.
SIGNS = [
    (os.path.join(HERE, "sign_secretary.png"), "এম আরিফুল আলম নোমান", "সদস্য সচিব"),
    (os.path.join(HERE, "sign_convener.png"), "মোঃ আনোয়ার হোসেন মুকুল", "আহ্বায়ক"),
]

_BN = {"0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪", "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯"}
_CACHE = {}


def bn(v):
    return "" if v is None else "".join(_BN.get(c, c) for c in str(v))


def font_bn(size):
    k = ("bn", size)
    if k not in _CACHE:
        _CACHE[k] = ImageFont.truetype(FONT_BN, size, layout_engine=ImageFont.Layout.RAQM)
    return _CACHE[k]


def font_lat(size):
    k = ("lat", size)
    if k not in _CACHE:
        _CACHE[k] = ImageFont.truetype(FONT_LAT, size)
    return _CACHE[k]


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


def _load_rgba(path):
    k = ("img", path)
    if k not in _CACHE:
        try:
            _CACHE[k] = Image.open(path).convert("RGBA")
        except Exception:
            _CACHE[k] = None
    return _CACHE[k]


def _circle(img, size):
    img = ImageOps.fit(img, (size, size), method=Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    r = img.convert("RGBA")
    r.putalpha(mask)
    return r


# ---- shared text helpers (take the ImageDraw so front & back can share) ----
def draw_left(d, x, y, text, size, fill):
    cx = x
    for run, lat in _runs(text):
        f = font_lat(size) if lat else font_bn(size)
        d.text((cx, y), run, font=f, fill=fill, anchor="ls")
        cx += f.getlength(run)


def draw_center(d, cx, y, text, size, fill):
    draw_left(d, cx - measure(text, size) / 2, y, text, size, fill)


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


def draw_kv(d, baseline, label, value, size):
    sep = " :  "
    total = measure(label, size) + measure(sep, size) + measure(value, size)
    x = W / 2 - total / 2
    draw_left(d, x, baseline, label, size, NAME_C)
    x += measure(label, size)
    draw_left(d, x, baseline, sep, size, NAME_C)
    x += measure(sep, size)
    draw_left(d, x, baseline, value, size, VALUE_C)


# ---- vector icons ----
def draw_phone_icon(d, x, y, size, color=DARK):
    w = size * 0.60
    d.rounded_rectangle((x, y, x + w, y + size), radius=w * 0.22, fill=color)
    d.rounded_rectangle((x + w * 0.14, y + size * 0.16, x + w * 0.86, y + size * 0.80),
                        radius=w * 0.10, fill=WHITE)
    d.line((x + w * 0.36, y + size * 0.09, x + w * 0.64, y + size * 0.09),
           fill=WHITE, width=max(2, int(size * 0.05)))
    r = size * 0.05
    cx, cy = x + w * 0.5, y + size * 0.90
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=WHITE)
    return w


def draw_blood_icon(d, x, y, size, color=RED):
    w = size * 0.72
    d.ellipse((x, y + size * 0.34, x + w, y + size), fill=color)
    d.polygon([(x + w / 2, y), (x + w * 0.05, y + size * 0.60), (x + w * 0.95, y + size * 0.60)], fill=color)
    # subtle highlight
    hr = w * 0.14
    d.ellipse((x + w * 0.28, y + size * 0.58, x + w * 0.28 + hr, y + size * 0.58 + hr),
              fill=(235, 150, 155))
    return w


def draw_icon_line(d, by, pairs, ts=34, isz=40):
    """Draw one centered line of (icon, value) pairs. pairs: [("phone", m), ("blood", b)]."""
    gap_it, gap_pair = 12, 46
    iw = lambda kind: isz * (0.60 if kind == "phone" else 0.72)
    total = sum(iw(k) + gap_it + measure(v, ts) for k, v in pairs) + gap_pair * (len(pairs) - 1)
    x = W / 2 - total / 2
    for kind, val in pairs:
        w = iw(kind)
        if kind == "phone":
            draw_phone_icon(d, x, by - isz + 8, isz, DARK)
        else:
            draw_blood_icon(d, x, by - isz + 8, isz, RED)
        x += w + gap_it
        draw_left(d, x, by, val, ts, VALUE_C)
        x += measure(val, ts) + gap_pair


def _pad_and_footer(im, d):
    """Inset navy footer bar + equal BODY-colour padding margin on all four sides."""
    P = 42
    footer_top = H - P - 38
    d.rectangle((P, footer_top, W - P, H - P), fill=DARK)
    d.rectangle((0, 0, W, P), fill=BODY)
    d.rectangle((0, H - P, W, H), fill=BODY)
    d.rectangle((0, 0, P, H), fill=BODY)
    d.rectangle((W - P, 0, W, H), fill=BODY)


def _draw_sign(im, d, cx, top_y, sign_path, name, role):
    s = _load_rgba(sign_path)
    if s is not None:
        s2 = s.copy()
        s2.thumbnail((176, 56), Image.LANCZOS)
        im.paste(s2, (int(cx - s2.width / 2), int(top_y + (56 - s2.height))), s2)
    rule_y = top_y + 62
    d.line((cx - 98, rule_y, cx + 98, rule_y), fill=NAME_C, width=2)
    draw_center(d, cx, rule_y + 28, name, fit_size(name, 214, 21, 14), NAME_C)
    draw_center(d, cx, rule_y + 52, role, fit_size(role, 200, 18, 13), VALUE_C)


# ================================ FRONT ================================
def render_card(data):
    im = Image.new("RGB", (W, H), BODY)
    d = ImageDraw.Draw(im)

    # ---- Curved header (organic lobe) — no logo, big heading ----
    d.rectangle((0, 0, W, 156), fill=DARK)
    d.ellipse((-250, -300, 602, 362), fill=DARK)

    org = data.get("org_name") or ORG_NAME
    osz = 34
    olines = wrap(org, W - 70, osz)[:2]
    ty = 96 if len(olines) == 2 else 122
    for ln in olines:
        draw_center(d, W / 2, ty, ln, osz, WHITE)
        ty += osz + 8

    # ---- Circular photo (overlapping the header) ----
    cxp, cyp, R = W // 2, 338, 124
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
        draw_center(d, W / 2, 536, name, fit_size(name, W - 124, 44, 28), NAME_C)

    # ---- Business-type pill ----
    y = 552
    biz = (data.get("business_type") or "").strip()
    if biz:
        bs = fit_size(biz, W - 150, 28, 20)
        pw = measure(biz, bs) + 70
        d.rounded_rectangle((W / 2 - pw / 2, y, W / 2 + pw / 2, y + 52), radius=12, fill=DARK)
        draw_center(d, W / 2, y + 35, biz, bs, WHITE)
        y += 82
    else:
        y += 28

    # ---- Member ID row (label : value) ----
    six = data.get("six_digit_id")
    if six:
        draw_kv(d, y + 32, "সদস্য আইডি", "NBA-" + str(six), 34)
        y += 48

    # ---- Mobile + blood group on one line, with icons ----
    pairs = []
    if data.get("mobile_number"):
        pairs.append(("phone", bn(data.get("mobile_number"))))
    if (data.get("blood_group") or "").strip():
        pairs.append(("blood", data["blood_group"].strip()))
    if pairs:
        draw_icon_line(d, y + 36, pairs, ts=34, isz=40)

    # ---- Authorising signatures (bottom) ----
    top_y = 792
    _draw_sign(im, d, W * 0.30, top_y, *SIGNS[0])
    _draw_sign(im, d, W * 0.70, top_y, *SIGNS[1])

    _pad_and_footer(im, d)
    return im


# ================================ BACK =================================
def render_card_back(data):
    im = Image.new("RGB", (W, H), BODY)
    d = ImageDraw.Draw(im)

    # ---- Header holding just the logo (org name is on the front) ----
    d.rectangle((0, 0, W, 205), fill=DARK)
    d.ellipse((-180, -250, 818, 300), fill=DARK)

    # logo in a white circle chip (moved here from the front)
    chip = 150
    cgx, cgy = (W - chip) // 2, 44
    d.ellipse((cgx, cgy, cgx + chip, cgy + chip), fill=WHITE)
    lg = _load_rgba(LOGO_HD) or _load_rgba(LOGO)
    if lg is not None:
        l2 = lg.copy()
        l2.thumbnail((chip - 8, chip - 8), Image.LANCZOS)
        im.paste(l2, (cgx + (chip - l2.width) // 2, cgy + (chip - l2.height) // 2), l2)

    # ---- QR (large, centered) ----
    QS = 350
    qx, qy = (W - QS) // 2, 262
    if data.get("qr_b64"):
        try:
            qr = Image.open(io.BytesIO(base64.b64decode(data["qr_b64"]))).convert("RGB").resize((QS, QS), Image.NEAREST)
            im.paste(qr, (qx, qy))
        except Exception:
            pass
    draw_center(d, W / 2, qy + QS + 40, "স্ক্যান করে সদস্যের তথ্য দেখুন", 23, NAME_C)

    # ---- Office block ----
    oy = qy + QS + 86
    office = data.get("office_addr") or OFFICE_ADDR
    phone = data.get("office_phone") or OFFICE_PHONE
    draw_center(d, W / 2, oy, office, fit_size(office, W - 90, 19, 13), VALUE_C)
    draw_center(d, W / 2, oy + 32, phone, 19, VALUE_C)

    # ---- Notes ----
    ny = oy + 78
    for note in NOTES:
        draw_center(d, W / 2, ny, note, fit_size(note, W - 96, 18, 12), VALUE_C)
        ny += 30

    _pad_and_footer(im, d)
    return im


def main():
    data = json.load(sys.stdin)
    out = io.BytesIO()
    if (data.get("format") or "pdf").lower() == "png":
        im = render_card_back(data) if data.get("side") == "back" else render_card(data)
        im.save(out, format="PNG")
    else:
        front = render_card(data)
        back = render_card_back(data)
        front.save(out, format="PDF", resolution=300.0, save_all=True, append_images=[back])
    sys.stdout.buffer.write(out.getvalue())


if __name__ == "__main__":
    main()
