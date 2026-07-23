#!/usr/bin/env python3
"""Render a member ID card (front + back) to stdout.

Reads a JSON member object from stdin: { format?, side?, six_digit_id, full_name,
business_type, mobile_number, blood_group, photo_b64, qr_b64, org_name? }.
Renders with Pillow + RAQM (Bangla shaping). Default output is a 2-page PDF
(front, back). With format:"png" a single side is emitted (side:"back" for the back,
else the front). `render_card(data)` / `render_card_back(data)` return PIL images and
are imported by render_idcards.py for the bulk grid.

Cards are drawn at SS x resolution and LANCZOS-downscaled for crisp (HD) output;
the QR is composited after the downscale so its modules stay pixel-sharp.
"""
import sys, os, io, json, base64
from PIL import Image, ImageDraw, ImageFont, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
FONT_BN = os.path.join(HERE, "fonts", "NotoSerifBengali-SemiBold.ttf")
FONT_LAT = os.path.join(HERE, "fonts", "DejaVuSans.ttf")
LOGO = os.path.join(HERE, "bazar-logo.png")
LOGO_HD = os.path.join(HERE, "bazar-logo-hd.png")   # crisper, transparent-bg logo

# Final card size: portrait CR80 @ 300 dpi (54 x 85.6 mm).
W, H = 638, 1012
SS = 2                       # supersampling factor for HD rendering
S = lambda v: int(round(v * SS))
P = 42                       # uniform padding on all four sides (logical px)

# ---- Palette ----
BASE_DARK = (13, 22, 38)     # front card base / padding margin (deep charcoal navy)
PANEL = (23, 36, 58)         # front inner content panel
PANEL_2 = (38, 54, 82)       # front placeholder chip / subtle raised elements
GOLD = (212, 175, 105)       # accent
GOLD_DEEP = (176, 138, 70)
TEXT_LIGHT = (240, 244, 250)
TEXT_MUTED = (168, 180, 198)
RED = (230, 76, 88)          # blood drop
DARK = (26, 48, 86)          # navy (back header / back text)
LIGHT = (238, 241, 247)      # back card base
SLATE = (74, 84, 100)        # back muted text
WHITE = (255, 255, 255)

# Fixed association info (overridable via payload).
BISMILLAH = "বিসমিল্লাহির রাহমানির রাহিম"
ORG_NAME = "নাঙ্গলকোট বাজার ব্যবসায়ী সংস্থা"
OFFICE_ADDR = "অফিস: নাঙ্গলকোট বাজার, উপজেলা: নাঙ্গলকোট, কুমিল্লা"
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


def _tint(img, color):
    """Recolour an RGBA image's strokes, preserving the alpha channel."""
    out = Image.new("RGBA", img.size, color + (0,))
    out.putalpha(img.getchannel("A"))
    return out


def _circle(img, size):
    img = ImageOps.fit(img, (size, size), method=Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    r = img.convert("RGBA")
    r.putalpha(mask)
    return r


# ---- shared text helpers (operate in whatever coordinate space they're given) ----
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


def draw_kv(d, cxw, baseline, label, value, size, label_c, value_c):
    sep = " :  "
    total = measure(label, size) + measure(sep, size) + measure(value, size)
    x = cxw / 2 - total / 2
    draw_left(d, x, baseline, label, size, label_c)
    x += measure(label, size)
    draw_left(d, x, baseline, sep, size, label_c)
    x += measure(sep, size)
    draw_left(d, x, baseline, value, size, value_c)


# ---- vector icons (consistent weight; drawn in scaled space) ----
def draw_phone_icon(d, x, y, size, body, screen):
    w = size * 0.60
    d.rounded_rectangle((x, y, x + w, y + size), radius=w * 0.22, fill=body)
    d.rounded_rectangle((x + w * 0.14, y + size * 0.16, x + w * 0.86, y + size * 0.80),
                        radius=w * 0.10, fill=screen)
    d.line((x + w * 0.36, y + size * 0.09, x + w * 0.64, y + size * 0.09),
           fill=screen, width=max(2, int(size * 0.05)))
    r = size * 0.05
    cx, cy = x + w * 0.5, y + size * 0.90
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=screen)
    return w


def draw_blood_icon(d, x, y, size, color):
    w = size * 0.72
    d.ellipse((x, y + size * 0.34, x + w, y + size), fill=color)
    d.polygon([(x + w / 2, y), (x + w * 0.05, y + size * 0.60), (x + w * 0.95, y + size * 0.60)], fill=color)
    hr = w * 0.14
    d.ellipse((x + w * 0.28, y + size * 0.58, x + w * 0.28 + hr, y + size * 0.58 + hr),
              fill=(246, 168, 175))
    return w


def draw_icon_line(d, cxw, by, pairs, ts, isz, icon_body, icon_screen, value_c):
    """One centered line of (icon, value) pairs. pairs: [("phone", m), ("blood", b)]."""
    gap_it, gap_pair = S(12), S(46)
    iw = lambda kind: isz * (0.60 if kind == "phone" else 0.72)
    total = sum(iw(k) + gap_it + measure(v, ts) for k, v in pairs) + gap_pair * (len(pairs) - 1)
    x = cxw / 2 - total / 2
    for kind, val in pairs:
        w = iw(kind)
        if kind == "phone":
            draw_phone_icon(d, x, by - isz + S(8), isz, icon_body, icon_screen)
        else:
            draw_blood_icon(d, x, by - isz + S(8), isz, RED)
        x += w + gap_it
        draw_left(d, x, by, val, ts, value_c)
        x += measure(val, ts) + gap_pair


# ================================ FRONT ================================
def render_card(data):
    WS, HS = S(W), S(H)
    im = Image.new("RGB", (WS, HS), BASE_DARK)
    d = ImageDraw.Draw(im)

    # ---- Inner content panel (padding frame stays visible around it) ----
    d.rounded_rectangle((S(P), S(P), WS - S(P), HS - S(P)), radius=S(18), fill=PANEL)

    # ---- Bismillah (topmost line) ----
    draw_center(d, WS / 2, S(78), BISMILLAH, S(19), GOLD)

    # ---- Logo in a white circle chip ----
    chip = S(88)
    cgx, cgy = (WS - chip) // 2, S(94)
    d.ellipse((cgx, cgy, cgx + chip, cgy + chip), fill=WHITE)
    lg = _load_rgba(LOGO_HD) or _load_rgba(LOGO)
    if lg is not None:
        l2 = lg.copy()
        bbox = l2.getbbox()          # trim transparent margins so it centres in the chip
        if bbox:
            l2 = l2.crop(bbox)
        sc = min((chip - S(10)) / l2.width, (chip - S(10)) / l2.height)
        l2 = l2.resize((max(1, int(l2.width * sc)), max(1, int(l2.height * sc))), Image.LANCZOS)
        im.paste(l2, (cgx + (chip - l2.width) // 2, cgy + (chip - l2.height) // 2), l2)

    # ---- Org name + gold rule ----
    org = data.get("org_name") or ORG_NAME
    osz = S(30)
    olines = wrap(org, S(W - 100), osz)[:2]
    ty = S(226) if len(olines) == 2 else S(244)
    for ln in olines:
        draw_center(d, WS / 2, ty, ln, osz, TEXT_LIGHT)
        ty += osz + S(8)
    rule_w = S(110)
    d.rounded_rectangle((WS / 2 - rule_w / 2, ty - S(16), WS / 2 + rule_w / 2, ty - S(10)),
                        radius=S(3), fill=GOLD)

    # ---- Circular photo with gold double ring ----
    cxp, cyp, R = WS // 2, S(398), S(100)
    d.ellipse((cxp - R - S(14), cyp - R - S(14), cxp + R + S(14), cyp + R + S(14)), fill=GOLD)
    d.ellipse((cxp - R - S(7), cyp - R - S(7), cxp + R + S(7), cyp + R + S(7)), fill=PANEL)
    ph = None
    if data.get("photo_b64"):
        try:
            ph = _circle(Image.open(io.BytesIO(base64.b64decode(data["photo_b64"]))).convert("RGB"), 2 * R)
        except Exception:
            ph = None
    if ph is None:
        chip = Image.new("RGB", (2 * R, 2 * R), PANEL_2)
        ImageDraw.Draw(chip).text(
            (R, R + S(40)), ((data.get("full_name") or "?").strip()[:1] or "?"),
            font=font_bn(S(120)), fill=GOLD, anchor="ms",
        )
        ph = _circle(chip, 2 * R)
    im.paste(ph, (cxp - R, cyp - R), ph)

    # ---- Member name ----
    name = (data.get("full_name") or "").strip()
    if name:
        draw_center(d, WS / 2, S(560), name, fit_size(name, S(W - 124), S(44), S(28)), TEXT_LIGHT)

    # ---- Business pill (gold chip, dark text) ----
    y = S(576)
    biz = (data.get("business_type") or "").strip()
    if biz:
        bs = fit_size(biz, S(W - 150), S(28), S(20))
        pw = measure(biz, bs) + S(70)
        d.rounded_rectangle((WS / 2 - pw / 2, y, WS / 2 + pw / 2, y + S(52)), radius=S(26), fill=GOLD)
        draw_center(d, WS / 2, y + S(35), biz, bs, BASE_DARK)
        y += S(82)
    else:
        y += S(28)

    # ---- Member ID row ----
    six = data.get("six_digit_id")
    if six:
        draw_kv(d, WS, y + S(32), "সদস্য আইডি", "NBA-" + str(six), S(34), GOLD, TEXT_LIGHT)
        y += S(48)

    # ---- Mobile + blood group on one line, with icons ----
    pairs = []
    if data.get("mobile_number"):
        pairs.append(("phone", bn(data.get("mobile_number"))))
    if (data.get("blood_group") or "").strip():
        pairs.append(("blood", data["blood_group"].strip()))
    if pairs:
        draw_icon_line(d, WS, y + S(36), pairs, ts=S(34), isz=S(40),
                       icon_body=GOLD, icon_screen=PANEL, value_c=TEXT_LIGHT)

    # ---- Authorising signatures (light strokes, gold rules) ----
    top_y = S(796)
    for cx_f, (path, sname, role) in zip((0.30, 0.70), SIGNS):
        cx = WS * cx_f
        sg = _load_rgba(path)
        if sg is not None:
            box_w, box_h = S(176), S(56)
            sc = min(box_w / sg.width, box_h / sg.height)
            s2 = _tint(sg, TEXT_LIGHT).resize((max(1, int(sg.width * sc)), max(1, int(sg.height * sc))), Image.LANCZOS)
            im.paste(s2, (int(cx - s2.width / 2), int(top_y + (box_h - s2.height))), s2)
        rule_y = top_y + S(62)
        d.rounded_rectangle((cx - S(98), rule_y, cx + S(98), rule_y + S(3)), radius=S(1), fill=GOLD_DEEP)
        draw_center(d, cx, rule_y + S(29), sname, fit_size(sname, S(214), S(21), S(14)), TEXT_LIGHT)
        draw_center(d, cx, rule_y + S(54), role, fit_size(role, S(200), S(18), S(13)), TEXT_MUTED)

    # ---- Slim gold footer strip (inside the panel, above bottom padding) ----
    d.rounded_rectangle((S(P + 26), HS - S(P + 24), WS - S(P + 26), HS - S(P + 12)),
                        radius=S(6), fill=GOLD)

    # ---- Equal padding margin on every side ----
    d.rectangle((0, 0, WS, S(P)), fill=BASE_DARK)
    d.rectangle((0, HS - S(P), WS, HS), fill=BASE_DARK)
    d.rectangle((0, 0, S(P), HS), fill=BASE_DARK)
    d.rectangle((WS - S(P), 0, WS, HS), fill=BASE_DARK)

    return im.resize((W, H), Image.LANCZOS)


# ================================ BACK =================================
# QR geometry (logical, shared between the 2x draw pass and the final paste).
QR_SIZE = 350
QR_X, QR_Y = (W - QR_SIZE) // 2, 262
QR_PAD = 18


def render_card_back(data):
    WS, HS = S(W), S(H)
    im = Image.new("RGB", (WS, HS), LIGHT)
    d = ImageDraw.Draw(im)

    # ---- Navy header curve holding the logo ----
    d.rectangle((0, 0, WS, S(205)), fill=DARK)
    d.ellipse((S(-180), S(-250), S(818), S(300)), fill=DARK)

    chip = S(150)
    cgx, cgy = (WS - chip) // 2, S(60)
    d.ellipse((cgx, cgy, cgx + chip, cgy + chip), fill=WHITE)
    lg = _load_rgba(LOGO_HD) or _load_rgba(LOGO)
    if lg is not None:
        l2 = lg.copy()
        bbox = l2.getbbox()          # trim transparent margins so it centres in the chip
        if bbox:
            l2 = l2.crop(bbox)
        sc = min((chip - S(14)) / l2.width, (chip - S(14)) / l2.height)
        l2 = l2.resize((max(1, int(l2.width * sc)), max(1, int(l2.height * sc))), Image.LANCZOS)
        im.paste(l2, (cgx + (chip - l2.width) // 2, cgy + (chip - l2.height) // 2), l2)

    # ---- White QR panel with thin gold border (QR itself pasted after downscale) ----
    px0, py0 = S(QR_X - QR_PAD), S(QR_Y - QR_PAD)
    px1, py1 = S(QR_X + QR_SIZE + QR_PAD), S(QR_Y + QR_SIZE + QR_PAD)
    d.rounded_rectangle((px0, py0, px1, py1), radius=S(16), fill=WHITE,
                        outline=GOLD_DEEP, width=S(3))

    draw_center(d, WS / 2, S(QR_Y + QR_SIZE + QR_PAD + 46), "স্ক্যান করে সদস্যের তথ্য দেখুন",
                S(23), DARK)

    # ---- Office block ----
    oy = S(QR_Y + QR_SIZE + QR_PAD + 96)
    office = data.get("office_addr") or OFFICE_ADDR
    phone = data.get("office_phone") or OFFICE_PHONE
    draw_center(d, WS / 2, oy, office, fit_size(office, S(W - 90), S(19), S(13)), SLATE)
    draw_center(d, WS / 2, oy + S(32), phone, S(19), SLATE)

    # ---- Notes ----
    ny = oy + S(80)
    for note in NOTES:
        draw_center(d, WS / 2, ny, note, fit_size(note, S(W - 96), S(18), S(12)), SLATE)
        ny += S(30)

    # ---- Slim gold footer strip (matches the front) ----
    d.rounded_rectangle((S(P + 26), HS - S(P + 24), WS - S(P + 26), HS - S(P + 12)),
                        radius=S(6), fill=GOLD)

    # ---- Equal padding margin on every side ----
    d.rectangle((0, 0, WS, S(P)), fill=LIGHT)
    d.rectangle((0, HS - S(P), WS, HS), fill=LIGHT)
    d.rectangle((0, 0, S(P), HS), fill=LIGHT)
    d.rectangle((WS - S(P), 0, WS, HS), fill=LIGHT)

    out = im.resize((W, H), Image.LANCZOS)

    # ---- QR pasted at final size: pixel-sharp modules for reliable scanning ----
    if data.get("qr_b64"):
        try:
            qr = Image.open(io.BytesIO(base64.b64decode(data["qr_b64"]))).convert("RGB")
            qr = qr.resize((QR_SIZE, QR_SIZE), Image.NEAREST)
            out.paste(qr, (QR_X, QR_Y))
        except Exception:
            pass
    return out


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
