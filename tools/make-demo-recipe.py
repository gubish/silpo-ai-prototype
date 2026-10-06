"""Намальовані інгредієнти для сценарію «Рецепти й інгредієнти» (гілка Chats)
→ assets/images/products/demo/recipe-<id>.svg. Не фото реальних товарів.
    python3 tools/make-demo-recipe.py"""
import pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'images' / 'products' / 'demo'

# Упаковка: (форма, рядок 1, рядок 2, колір упаковки, етикетка, текст)
PACKS = {
    'spaghetti':  ('box', 'Спагеті', '500 г', '#1f4fa8', '#ffffff', '#1f4fa8'),
    'salt':       ('box', 'Сіль', 'кухонна', '#5b6b7a', '#ffffff', '#33414d'),
    'tomatoesCan': ('can', 'Томати', 'у власному соку', '#c0392b', '#fff3e6', '#8a2318'),
    'anchovies':  ('tin', 'Анчоуси', 'в олії', '#2c5f7c', '#eaf3f8', '#1d3f52'),
    'olives':     ('jar', 'Маслини', 'без кісточок', '#2b2b2b', '#eef0e6', '#2b2b2b'),
    'capers':     ('jar', 'Каперси', 'мариновані', '#5a7a2b', '#f1f6e6', '#3d5520'),
    'oregano':    ('jar', 'Орегано', 'сушене', '#3a8f4c', '#eef7e9', '#1f5a2c'),
    'vinegar':    ('bottle', 'Оцет', 'яблучний', '#b5651d', '#fff6e8', '#7a4310'),
    'sugar':      ('bag', 'Цукор', '1 кг', '#e8e3d8', '#ffffff', '#6b5f4a'),
    'walnuts':    ('bag', 'Волоські', 'горіхи', '#8b5a2b', '#fbf2e6', '#5c3a19'),
    'blueCheese': ('wedge', 'Сир з блакитною', 'пліснявою', '#eef1f6', '#ffffff', '#3b5b8a'),
}
# Овочі й зелень: (форма, колір, тінь)
FRESH = {
    'garlic':      ('garlic', '#f4efe6', '#d8cdb8'),
    'parsley':     ('herb', '#3f8f3a', '#245c22'),
    'mint':        ('herb', '#58b06a', '#2f6b3a'),
    'rucola':      ('leaves', '#4f8f3a', '#2f5f23'),
    'saladLeaves': ('leaves', '#8cc152', '#5a8a2e'),
}

def demo(y=300):
    return ''  # без позначки «ДЕМО»: увесь прототип демонстраційний

def label(l1, l2, ink, y=178):
    return (f'<text x="162" y="{y}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="20" fill="{ink}">{l1}</text>'
            f'<text x="162" y="{y + 24}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="{ink}">{l2}</text>')

def pack(shape, l1, l2, color, lab, ink):
    if shape == 'box':
        body = (f'<rect x="92" y="60" width="140" height="210" rx="10" fill="{color}"/>'
                f'<rect x="104" y="140" width="116" height="80" rx="6" fill="{lab}"/>')
    elif shape == 'jar':
        body = (f'<rect x="112" y="64" width="100" height="30" rx="6" fill="{color}"/>'
                f'<rect x="100" y="92" width="124" height="180" rx="16" fill="#f6f3ea" stroke="#e1dccd" stroke-width="2"/>'
                f'<rect x="104" y="140" width="116" height="80" rx="6" fill="{lab}"/>')
    elif shape == 'can':
        body = (f'<rect x="96" y="78" width="132" height="190" rx="12" fill="#cfd3d6"/>'
                f'<rect x="96" y="104" width="132" height="138" fill="{color}"/>'
                f'<rect x="104" y="140" width="116" height="80" rx="6" fill="{lab}"/>')
    elif shape == 'tin':
        body = (f'<rect x="62" y="120" width="200" height="110" rx="20" fill="{color}"/>'
                f'<rect x="80" y="138" width="164" height="74" rx="8" fill="{lab}"/>')
        return body + label(l1, l2, ink, y=168)
    elif shape == 'bottle':
        body = (f'<rect x="146" y="40" width="32" height="40" rx="4" fill="{color}"/>'
                f'<path d="M140 80h44c0 30 30 40 30 70v110c0 10-8 18-18 18h-68c-10 0-18-8-18-18V150c0-30 30-40 30-70z" fill="{color}" opacity="0.85"/>'
                f'<rect x="104" y="150" width="116" height="80" rx="6" fill="{lab}"/>')
    elif shape == 'bag':
        body = (f'<path d="M92 70h140l-6 30 10 170H88l10-170z" fill="{color}"/>'
                f'<rect x="104" y="140" width="116" height="80" rx="6" fill="{lab}"/>')
    elif shape == 'cup':
        body = (f'<path d="M96 96h132l-14 176H110z" fill="{lab}" stroke="#d9e3ea" stroke-width="2"/>'
                f'<rect x="90" y="84" width="144" height="16" rx="4" fill="{color}"/>')
    else:  # wedge
        body = (f'<path d="M70 250 L254 250 L254 150 Z" fill="{color}"/>'
                f'<path d="M70 250 L254 150 L254 120 L70 222 Z" fill="#f2d98a"/>'
                f'<circle cx="200" cy="215" r="9" fill="#d9ad45"/><circle cx="160" cy="232" r="6" fill="#d9ad45"/>')
        return body + label(l1, l2, ink, y=98)
    return body + label(l1, l2, ink)

def fresh(shape, c, d):
    if shape == 'garlic':
        return (f'<path d="M162 70c6 22 30 30 52 52 40 40 22 120-52 128-74-8-92-88-52-128 22-22 46-30 52-52z" fill="{c}" stroke="{d}" stroke-width="3"/>'
                f'<path d="M162 120v126M130 140c-10 40-4 80 22 104M194 140c10 40 4 80-22 104" stroke="{d}" stroke-width="3" fill="none"/>')
    if shape == 'cucumber':
        return (f'<rect x="60" y="130" width="210" height="62" rx="31" fill="{c}" transform="rotate(-18 165 161)"/>'
                f'<rect x="80" y="210" width="190" height="56" rx="28" fill="{d}" transform="rotate(-18 175 238)"/>')
    if shape == 'leaves':
        return ''.join(f'<ellipse cx="{120 + k * 28}" cy="{170 + (k % 2) * 30}" rx="34" ry="70" fill="{c if k % 2 else d}" opacity="0.9" transform="rotate({-30 + k * 20} {120 + k * 28} {170 + (k % 2) * 30})"/>' for k in range(4))
    # herb: пучок зелені
    stems = ''.join(f'<path d="M162 270 C{150 + k * 6} 200 {120 + k * 16} 140 {110 + k * 24} 80" stroke="{d}" stroke-width="3" fill="none"/>' for k in range(5))
    leaves = ''.join(f'<circle cx="{110 + k * 24 + j * 4}" cy="{80 + j * 18}" r="11" fill="{c}" opacity="0.85"/>' for k in range(5) for j in range(4))
    return stems + leaves + f'<rect x="146" y="240" width="32" height="14" rx="4" fill="#c0392b"/>'

def svg(inner, demo_y=300):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 324 324" width="324" height="324">
  <rect width="324" height="324" fill="#fff"/>
  {inner}
  {demo(demo_y)}
</svg>
'''

if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for pid, args in PACKS.items():
        (OUT / f'recipe-{pid}.svg').write_text(svg(pack(*args)))
        print(pid)
    for pid, args in FRESH.items():
        (OUT / f'recipe-{pid}.svg').write_text(svg(fresh(*args), demo_y=306))
        print(pid)
