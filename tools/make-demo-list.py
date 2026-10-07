"""Сценарій «Список покупок із фото» (гілка Chats):
• assets/images/demo/shopping-list.svg — «фото» рукописного списку (папірець, почерк — системний рукописний шрифт);
• assets/images/products/demo/list-<id>.svg — намальовані товари (форми — з make-demo-recipe.py).
    python3 tools/make-demo-list.py"""
import importlib.util, pathlib

HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('recipe', HERE / 'make-demo-recipe.py')
R = importlib.util.module_from_spec(spec); spec.loader.exec_module(R)

PACKS = {
    'milk':      ('box', 'Молоко', '2,5% · 900 г', '#3a7bd5', '#ffffff', '#1f4f99'),
    'milk32':    ('box', 'Молоко', '3,2% · 900 г', '#1f4f99', '#ffffff', '#1f4f99'),
    'eggs':      ('tin', 'Яйця', '10 шт · С1', '#c9a46a', '#fff8ec', '#7a5a2a'),
    'cheese':    ('wedge', 'Сир твердий', 'Гауда', '#f2c94c', '#fff8e1', '#7a5a12'),
    'cottage':   ('cup', 'Сир', 'кисломолочний 5%', '#4a90d9', '#ffffff', '#1f4f99'),
    'processed': ('tin', 'Сир', 'плавлений', '#d98c2b', '#fff3e0', '#7a4a10'),
    'coffee':    ('bag', 'Кава мелена', 'арабіка 250 г', '#5a3a22', '#f6ece2', '#3d2616'),
    # «Кошик під подію»
    'juice':     ('box', 'Сік', 'яблучний 1 л', '#2e9e4f', '#ffffff', '#1f6b35'),
    'crisps':    ('bag', 'Чипси', 'з сіллю 150 г', '#e8b923', '#fff8e1', '#7a5a12'),
}

def bread():
    return ('<path d="M60 200c0-60 46-100 102-100s102 40 102 100v40H60z" fill="#d9a25f"/>'
            '<path d="M60 240h204v18c0 8-6 14-14 14H74c-8 0-14-6-14-14z" fill="#b97f3e"/>'
            + ''.join(f'<path d="M{100 + k * 32} 130c10 20 10 40 0 60" stroke="#b97f3e" stroke-width="5" fill="none"/>' for k in range(4))
            + R.label('Батон', 'нарізний', '#5c3a19', y=300 - 70))

LINES = ['молоко', 'хліб', 'яйця 10', 'сир', 'банани', 'помідори', 'кава Lavazza', 'майонез']

def note():
    font = "Noteworthy, 'Marker Felt', 'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive"
    rules = ''.join(f'<line x1="40" y1="{118 + k * 52}" x2="340" y2="{118 + k * 52}" stroke="#c9d6ea" stroke-width="1.5"/>' for k in range(9))
    words = ''.join(f'<text x="{60 + (k % 3) * 4}" y="{110 + k * 52}" font-family="{font}" font-size="40" fill="#24324a" transform="rotate({(-1.5 + (k % 4)) * 0.6} 60 {110 + k * 52})">{w}</text>'
                    for k, w in enumerate(LINES))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560" width="400" height="560">
  <rect width="400" height="560" fill="#8a7f72"/>
  <g transform="rotate(-3 200 280)">
    <rect x="24" y="22" width="352" height="516" rx="4" fill="#fffdf6"/>
    <line x1="70" y1="22" x2="70" y2="538" stroke="#f2b8b8" stroke-width="1.5"/>
    {rules}
    {words}
  </g>
</svg>
'''

if __name__ == '__main__':
    R.OUT.mkdir(parents=True, exist_ok=True)
    for pid, args in PACKS.items():
        (R.OUT / f'list-{pid}.svg').write_text(R.svg(R.pack(*args)))
    (R.OUT / 'list-bread.svg').write_text(R.svg(bread()))
    demo = HERE.parent / 'assets' / 'images' / 'demo'
    demo.mkdir(parents=True, exist_ok=True)
    (demo / 'shopping-list.svg').write_text(note())
    print('ok')
