#!/usr/bin/env python3
"""Generate a 1200x630 OG image for a blog article.

Usage:
  python3 scripts/generate-blog-og-image.py \
    --title "Price Elasticity Modelling for FMCG" \
    --subtitle "A Practical Guide" \
    --stat1-value "9 min read"  --stat1-label "ARTICLE LENGTH" \
    --stat2-value "P1"          --stat2-label "PRICING INTELLIGENCE" \
    --stat3-value "1,500"       --stat3-label "MONTHLY SEARCHES" \
    --output public/blog/price-elasticity-modelling-fmcg-og.png

Layout follows the gold-standard pattern established by the blog:
  - 1200x630 navy background
  - Teal top bar, red bottom bar
  - "MarginCOS" wordmark top-left (COS in red)
  - Title left-side serif white (auto-wraps)
  - Subtitle below title in muted slate
  - Three stat cards stacked right side, asymmetric
  - Centred footer
"""

import argparse
import os
import sys
from PIL import Image, ImageDraw, ImageFont


# ── Brand colours ────────────────────────────────────────────────────────────
NAVY      = (27, 42, 74)      # #1B2A4A
TEAL      = (13, 143, 143)    # #0D8F8F
RED       = (192, 57, 43)     # #C0392B
GOLD      = (212, 168, 67)    # #D4A843
WHITE     = (255, 255, 255)
SLATE_LIGHT = (226, 232, 240) # #E2E8F0
SLATE_LBL = (208, 216, 228)   # #D0D8E4
CARD_BG   = (48, 72, 102)     # #304866


# ── Canvas + bars ────────────────────────────────────────────────────────────
W, H = 1200, 630
BAR_TOP_H    = 8
BAR_BOTTOM_H = 12


def find_font(weight='regular'):
    """Try to find a serif font. DejaVu Serif is reliable across Linux."""
    candidates = {
        'bold':     ['/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf',
                     '/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf'],
        'regular':  ['/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf',
                     '/System/Library/Fonts/Supplemental/Times New Roman.ttf'],
        'sans':     ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                     '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'],
        'sans-bold':['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
                     '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'],
    }
    for path in candidates.get(weight, []):
        if os.path.exists(path):
            return path
    return None


def font(weight, size):
    path = find_font(weight)
    if path is None:
        return ImageFont.load_default()
    return ImageFont.truetype(path, size)


def wrap_text(text, max_width, draw, fnt):
    """Greedy word wrap to fit within max_width pixels."""
    words = text.split()
    lines, current = [], ''
    for w in words:
        candidate = (current + ' ' + w).strip()
        bbox = draw.textbbox((0, 0), candidate, font=fnt)
        if bbox[2] - bbox[0] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = w
    if current:
        lines.append(current)
    return lines


def draw_logo(draw):
    """Top-left wordmark: 'Margin' in white + 'COS' in red, 38px serif."""
    fnt = font('bold', 38)
    margin_x, margin_y = 56, 36
    margin_text = 'Margin'
    draw.text((margin_x, margin_y), margin_text, font=fnt, fill=WHITE)
    margin_w = draw.textbbox((0, 0), margin_text, font=fnt)[2]
    draw.text((margin_x + margin_w, margin_y), 'COS', font=fnt, fill=RED)


def draw_title_block(draw, title, subtitle):
    """Left side: title (auto-wrap, 56px serif white) + subtitle (22px muted)."""
    title_fnt = font('bold', 56)
    sub_fnt   = font('regular', 22)

    title_x = 56
    title_max_w = 640  # leaves room for stat cards on the right

    lines = wrap_text(title, title_max_w, draw, title_fnt)

    # Vertical centering of the title block in the available area
    # (between top bar and footer)
    available_top = 130   # below logo
    available_bot = 530   # above footer
    line_h = 70
    total_h = len(lines) * line_h + (32 if subtitle else 0) + (24 if subtitle else 0)
    start_y = available_top + ((available_bot - available_top) - total_h) // 2

    y = start_y
    for line in lines:
        draw.text((title_x, y), line, font=title_fnt, fill=WHITE)
        y += line_h

    if subtitle:
        y += 12
        draw.text((title_x, y), subtitle, font=sub_fnt, fill=SLATE_LIGHT)


def draw_stat_card(draw, x, y, w, h, value, label, value_color):
    """Stat card: value top, label bottom, on a #304866 background."""
    radius = 12
    draw.rounded_rectangle([(x, y), (x + w, y + h)], radius=radius, fill=CARD_BG)

    val_fnt = font('sans-bold', 44)
    lbl_fnt = font('sans', 14)

    # Centre value horizontally
    val_bbox = draw.textbbox((0, 0), value, font=val_fnt)
    val_w = val_bbox[2] - val_bbox[0]
    val_h = val_bbox[3] - val_bbox[1]
    draw.text((x + (w - val_w) // 2, y + 26), value, font=val_fnt, fill=value_color)

    # Centre label
    lbl_bbox = draw.textbbox((0, 0), label, font=lbl_fnt)
    lbl_w = lbl_bbox[2] - lbl_bbox[0]
    draw.text((x + (w - lbl_w) // 2, y + h - 36), label, font=lbl_fnt, fill=SLATE_LBL)


def draw_stat_cards(draw, cards):
    """Three stat cards stacked vertically on the right side."""
    card_w = 280
    card_h = 110
    card_x = W - card_w - 56
    gap = 18
    total_h = 3 * card_h + 2 * gap
    start_y = (H - total_h) // 2

    colors = [TEAL, GOLD, RED]
    for i, c in enumerate(cards):
        y = start_y + i * (card_h + gap)
        draw_stat_card(draw, card_x, y, card_w, card_h, c['value'], c['label'], colors[i])


def draw_footer(draw, text):
    """Centred footer just above the bottom bar."""
    fnt = font('sans', 16)
    bbox = draw.textbbox((0, 0), text, font=fnt)
    w = bbox[2] - bbox[0]
    x = (W - w) // 2
    y = H - BAR_BOTTOM_H - 32
    draw.text((x, y), text, font=fnt, fill=SLATE_LBL)


def generate(args):
    img = Image.new('RGB', (W, H), NAVY)
    draw = ImageDraw.Draw(img)

    # Top bar (teal)
    draw.rectangle([(0, 0), (W, BAR_TOP_H)], fill=TEAL)
    # Bottom bar (red)
    draw.rectangle([(0, H - BAR_BOTTOM_H), (W, H)], fill=RED)

    draw_logo(draw)
    draw_title_block(draw, args.title, args.subtitle)
    draw_stat_cards(draw, [
        {'value': args.stat1_value, 'label': args.stat1_label},
        {'value': args.stat2_value, 'label': args.stat2_label},
        {'value': args.stat3_value, 'label': args.stat3_label},
    ])
    draw_footer(draw, 'A product of Carthena Advisory  ·  margincos.com  ·  carthenaadvisory.com')

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    img.save(args.output, 'PNG', optimize=True)
    print(f'Wrote {args.output} ({W}x{H})')


def main():
    p = argparse.ArgumentParser(description='Generate a 1200x630 blog OG image.')
    p.add_argument('--title',    required=True)
    p.add_argument('--subtitle', default='')
    p.add_argument('--stat1-value', required=True)
    p.add_argument('--stat1-label', required=True)
    p.add_argument('--stat2-value', required=True)
    p.add_argument('--stat2-label', required=True)
    p.add_argument('--stat3-value', required=True)
    p.add_argument('--stat3-label', required=True)
    p.add_argument('--output',   required=True)
    args = p.parse_args()
    generate(args)


if __name__ == '__main__':
    main()
