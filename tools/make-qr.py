"""QR-коди «Відкрити на телефоні» для кожної гілки дизайну → assets/qr/branch-<id>.svg.
Посилання — онлайн-версія на GitHub Pages. Потрібна бібліотека qrcode:
    python3 -m venv /tmp/qrenv && /tmp/qrenv/bin/pip install qrcode
    /tmp/qrenv/bin/python tools/make-qr.py
Нова гілка — допишіть її в BRANCHES і запустіть знову."""
import pathlib
import qrcode
import qrcode.image.svg

BASE = 'https://gubish.github.io/silpo-ai-prototype/?branch='
BRANCHES = ['a', 'b', 'c']
out = pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'qr'
out.mkdir(parents=True, exist_ok=True)
for b in BRANCHES:
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=0)
    qr.add_data(BASE + b + '&from=qr')  # from=qr — на телефоні покаже «Відкрийте як застосунок»
    img = qr.make_image(image_factory=qrcode.image.svg.SvgPathImage)
    svg = (img.to_string(encoding='unicode')
           .replace('fill="#000000"', 'fill="#202124" shape-rendering="crispEdges"')
           .replace('width="33mm" height="33mm" ', ''))  # розмір задає CSS
    (out / f'branch-{b}.svg').write_text(svg)
    print(b, BASE + b + '&from=qr')
