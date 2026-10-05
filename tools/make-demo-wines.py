"""Намальовані пляшки для демо-вин гілки D → assets/images/products/demo/<id>.svg.
Це НЕ фото реальних товарів: на етикетці — сорт і напис «ДЕМО».
Справжні фото з'являться — замініть image у js/scenarios/wine.js.
    python3 tools/make-demo-wines.py"""
import pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'images' / 'products' / 'demo'
# id: (рядок 1, рядок 2, скло, капсула, етикетка, форма)
WINES = {
    'cabernet':  ('Cabernet', 'Sauvignon', '#3a1a22', '#7a1f2b', '#f3ead8', 'bordeaux'),
    'malbec':    ('Malbec', 'Argentina', '#2e1219', '#4a1a6b', '#efe4cf', 'bordeaux'),
    'pinot':     ('Pinot', 'Noir', '#4a1f26', '#b08a3e', '#f6efe2', 'burgundy'),
    'sauvignon': ('Sauvignon', 'Blanc', '#6f8f4e', '#d9d2b0', '#ffffff', 'bordeaux'),
    'riesling':  ('Riesling', 'Mosel', '#5b7d3c', '#2f5f8a', '#fbf7ec', 'flute'),
    'rose':      ('Rosé', 'Provence', '#e9b7b0', '#e2c9a0', '#ffffff', 'burgundy'),
    'prosecco':  ('Prosecco', 'Italia', '#2f4a30', '#c9a24a', '#f4efe0', 'sparkling'),
}

def bottle(shape):
    """Контур пляшки в полі 324×324, центр x=162"""
    if shape == 'flute':      # висока вузька (рислінг)
        return 'M152 22h20v58c0 22 22 34 22 70v148c0 6-4 10-10 10h-44c-6 0-10-4-10-10V150c0-36 22-48 22-70z'
    if shape == 'burgundy':   # покаті плечі
        return 'M152 24h20v52c0 26 40 46 40 92v130c0 6-4 10-10 10h-80c-6 0-10-4-10-10V168c0-46 40-66 40-92z'
    if shape == 'sparkling':  # ігристе: ширше, з фольгою
        return 'M150 22h24v60c0 24 40 40 40 84v132c0 6-4 10-10 10h-84c-6 0-10-4-10-10V166c0-44 40-60 40-84z'
    return 'M152 24h20v58c0 16 32 22 32 44v172c0 6-4 10-10 10h-64c-6 0-10-4-10-10V126c0-22 32-28 32-44z'  # бордо

def svg(l1, l2, glass, cap, label, shape):
    wide = {'flute': 32, 'burgundy': 50, 'sparkling': 52}.get(shape, 40)
    cap_h = 70 if shape == 'sparkling' else 44
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 324 324" width="324" height="324">
  <rect width="324" height="324" fill="#fff"/>
  <path d="{bottle(shape)}" fill="{glass}"/>
  <rect x="150" y="20" width="24" height="{cap_h}" rx="3" fill="{cap}"/>
  <path d="M{162 - wide + 8} 150v130" stroke="#fff" stroke-opacity=".18" stroke-width="6" stroke-linecap="round"/>
  <rect x="{162 - wide + 4}" y="190" width="{(wide - 4) * 2}" height="78" rx="4" fill="{label}"/>
  <text x="162" y="220" text-anchor="middle" font-family="Georgia, serif" font-size="{13 if len(l1) > 8 else 15}" fill="#3a2a1a">{l1}</text>
  <text x="162" y="238" text-anchor="middle" font-family="Georgia, serif" font-size="11" fill="#3a2a1a">{l2}</text>
  <text x="162" y="258" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" letter-spacing="2" fill="#9a8a7a">ДЕМО</text>
</svg>
'''

OUT.mkdir(parents=True, exist_ok=True)
for wid, args in WINES.items():
    (OUT / f'wine-{wid}.svg').write_text(svg(*args))
    print(wid)
