#!/usr/bin/env python3
"""生成本地占位图：tabBar 图标 / 首页 Banner / 产品占位图。
仅用于开发期占位，上线前请替换为真实商品图。"""
import math
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), "..")
IMG = os.path.normpath(os.path.join(ROOT, "images"))
TAB = os.path.join(IMG, "tab")

GRAY = (153, 148, 140, 255)
RED = (185, 67, 47, 255)
BG_TINTS = ["#F5EBDE", "#F1E4D2", "#F6EDE1", "#EEE1CD", "#F3E7D6", "#EFE2D0"]
FAN_COLORS = ["#B9432F", "#C9A063", "#8E5B3C", "#A34A2A", "#7C4A32", "#B96A3F"]

FONT_CANDIDATES = [
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
    "/System/Library/Fonts/STHeiti Medium.ttc",
    "/System/Library/Fonts/STHeiti Light.ttc",
]


def load_font(size):
    for p in FONT_CANDIDATES:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()


def draw_fan(draw, cx, cy, radius, spread_deg, color, rib_color=(255, 255, 255, 220), ribs=9):
    """一把展开的折扇：扇形 + 白色扇骨 + 中心铆钉。cx,cy 为扇钉位置。"""
    start = -90 - spread_deg / 2
    end = -90 + spread_deg / 2
    draw.pieslice([cx - radius, cy - radius, cx + radius, cy + radius],
                  start, end, fill=color)
    for i in range(ribs):
        ang = math.radians(start + spread_deg * i / (ribs - 1))
        x2 = cx + math.cos(ang) * radius
        y2 = cy + math.sin(ang) * radius
        draw.line([cx, cy, x2, y2], fill=rib_color, width=max(2, radius // 90))
    r = max(6, radius // 22)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 255, 255, 255))


def gen_tab_icons():
    size = 81
    os.makedirs(TAB, exist_ok=True)
    icons = {
        "home": lambda d: _home(d),
        "category": lambda d: _grid(d),
        "inquiry": lambda d: _chat(d),
        "cart": lambda d: _cart(d),
        "about": lambda d: _user(d),
    }
    for name, painter in icons.items():
        for suffix, color in (("gray", GRAY), ("red", RED)):
            im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            painter(ImageDraw.Draw(im))
            _recolor(im, color)
            im.save(os.path.join(TAB, f"{name}-{suffix}.png"))
    print("tabBar icons: 8")


def _recolor(im, color):
    # 用纯色替换所有非透明像素，得到单色图标
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y][3] > 0:
                px[x, y] = color


def _home(d):
    d.polygon([(40, 14), (68, 38), (13, 38)], fill=(0, 0, 0))
    d.rectangle([19, 38, 62, 66], fill=(0, 0, 0))
    d.rectangle([34, 48, 47, 66], fill=(255, 255, 255))


def _grid(d):
    for x in (14, 44):
        for y in (14, 44):
            d.rounded_rectangle([x, y, x + 23, y + 23], radius=5, fill=(0, 0, 0))


def _chat(d):
    d.rounded_rectangle([12, 16, 69, 54], radius=10, fill=(0, 0, 0))
    d.polygon([(22, 52), (34, 52), (22, 66)], fill=(0, 0, 0))
    for x in (28, 40, 52):
        d.ellipse([x - 3, 31, x + 3, 37], fill=(255, 255, 255))


def _cart(d):
    # 提手 + 车斗 + 两个轮子
    d.line([(6, 16), (22, 16)], fill=(0, 0, 0), width=6)
    d.line([(22, 16), (32, 30)], fill=(0, 0, 0), width=6)
    d.polygon([(30, 28), (76, 28), (68, 56), (38, 56)], fill=(0, 0, 0))
    d.ellipse([36, 58, 48, 70], fill=(0, 0, 0))
    d.ellipse([56, 58, 68, 70], fill=(0, 0, 0))


def _user(d):
    d.ellipse([28, 12, 53, 37], fill=(0, 0, 0))
    d.pieslice([14, 40, 67, 96], 180, 360, fill=(0, 0, 0))


def gen_banners():
    os.makedirs(IMG, exist_ok=True)
    banners = [
        ("匠心手扇 · 厂家直供", "二十余年制扇经验", "#B9432F", "#7E2A1B"),
        ("支持来图来样定制", "婚礼 / 舞台 / 节日送礼", "#8E5B3C", "#5C3A25"),
        ("批零兼营 · 一件代发", "现货充足 欢迎询价", "#A34A2A", "#6E2F1C"),
    ]
    f_big, f_small = load_font(56), load_font(28)
    for i, (t1, t2, c1, c2) in enumerate(banners, 1):
        w, h = 750, 400
        im = Image.new("RGB", (w, h), c1)
        d = ImageDraw.Draw(im, "RGBA")
        top = tuple(int(c1[j:j + 2], 16) for j in (1, 3, 5))
        bot = tuple(int(c2[j:j + 2], 16) for j in (1, 3, 5))
        for y in range(h):
            k = y / h
            d.line([(0, y), (w, y)], fill=tuple(int(top[j] + (bot[j] - top[j]) * k) for j in range(3)))
        overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        draw_fan(od, w - 130, h + 60, 340, 150, (255, 255, 255, 40),
                 rib_color=(255, 255, 255, 60))
        im = Image.alpha_composite(im.convert("RGBA"), overlay).convert("RGB")
        d = ImageDraw.Draw(im, "RGBA")
        d.text((48, 130), t1, font=f_big, fill=(255, 250, 244))
        d.text((50, 210), t2, font=f_small, fill=(255, 236, 214, 230))
        d.text((50, 300), f"0{i}", font=load_font(30), fill=(255, 255, 255, 120))
        im.save(os.path.join(IMG, f"banner{i}.png"), quality=90)
    print("banners: 3")


def gen_products():
    """12 个产品 × 3 张图（扇形角度/色调略有差异，模拟多图）。"""
    os.makedirs(IMG, exist_ok=True)
    f_label = load_font(40)
    for p in range(12):
        tint = BG_TINTS[p % len(BG_TINTS)]
        fan = FAN_COLORS[p % len(FAN_COLORS)]
        for v in range(3):
            im = Image.new("RGB", (600, 600), tint)
            d = ImageDraw.Draw(im, "RGBA")
            spread = 110 + v * 25
            draw_fan(d, 300, 470, 330, spread, fan)
            d.text((300, 548), f"样品图 {p + 1}-{v + 1}", font=f_label,
                   fill=(120, 100, 80), anchor="mm")
            im.save(os.path.join(IMG, f"p{p + 1:02d}_{v + 1}.png"), quality=90)
    print("product placeholders: 36")


if __name__ == "__main__":
    gen_tab_icons()
    gen_banners()
    gen_products()
    print("done ->", IMG)
