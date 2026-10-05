"""Намальовані баночки майонезу для сценарію «Заміна товару» (гілка Chats)
→ assets/images/products/demo/mayo-<id>.svg. Не фото реальних товарів: на етикетці «ДЕМО».
    python3 tools/make-demo-mayo.py"""
import pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'images' / 'products' / 'demo'
# id: (рядок 1, рядок 2, кришка, етикетка, текст)
JARS = {
    'home':  ('Домашній', '72%', '#d8372b', '#fff3d6', '#7a2a12'),
    'light': ('Легкий', '30%', '#3a8f4c', '#eef7e9', '#1f5a2c'),
    'vegan': ('Без яєць', 'пісний', '#7a6a3a', '#f3f0e2', '#4a3f1c'),
}

def svg(l1, l2, lid, label, ink):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 324 324" width="324" height="324">
  <rect width="324" height="324" fill="#fff"/>
  <rect x="96" y="70" width="132" height="34" rx="8" fill="{lid}"/>
  <path d="M100 104h124c10 0 16 8 16 18v128c0 18-12 30-30 30H114c-18 0-30-12-30-30V122c0-10 6-18 16-18z" fill="#fbfaf5" stroke="#e6e1d3" stroke-width="2"/>
  <rect x="88" y="150" width="148" height="86" rx="6" fill="{label}"/>
  <text x="162" y="184" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="17" fill="{ink}">{l1}</text>
  <text x="162" y="206" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="{ink}">майонез · {l2}</text>
  <text x="162" y="226" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" letter-spacing="2" fill="#9a8a7a">ДЕМО</text>
</svg>
'''

OUT.mkdir(parents=True, exist_ok=True)
for jid, args in JARS.items():
    (OUT / f'mayo-{jid}.svg').write_text(svg(*args))
    print(jid)
