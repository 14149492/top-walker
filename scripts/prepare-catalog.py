"""Deterministic crops of supplied photos. Requires Pillow; never modifies originals."""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'zapatos1'
OUT = ROOT / 'backend/catalog'
# Bounds individually reviewed against each original; no commercial text remains.
rows = [
 ('bjh6hebjh6hebjh6 (1)', 'mustang', 'Cafe combinado', 1598),
 ('bjh6hebjh6hebjh6 (2)', 'mustang', 'Cafe', 1720),
 ('bjh6hebjh6hebjh6 (3)', 'rockstar', 'Negro', 1695),
 ('bjh6hebjh6hebjh6', 'mustang', 'Negro', 1625),
 ('ewwqf0ewwqf0ewwq', 'rockstar', 'Cafe', 1617),
 ('o0qg7qo0qg7qo0qg (1)', 'shelby', 'Negro', 1790),
 ('o0qg7qo0qg7qo0qg (2)', 'thunder', 'Negro', 1676),
 ('o0qg7qo0qg7qo0qg (3)', 'rockstar', 'Negro combinado', 1694),
 ('o0qg7qo0qg7qo0qg (4)', 'mustang', 'Negro combinado', 1703),
 ('o0qg7qo0qg7qo0qg', 'luca', 'Negro', 1642),
 ('ov2zr4ov2zr4ov2z (1)', 'rockstar', 'Camel', 1615),
 ('ov2zr4ov2zr4ov2z (2)', 'shadow', 'Cafe', 1689),
 ('ov2zr4ov2zr4ov2z (3)', 'zero', 'Cafe', 1754),
 ('ov2zr4ov2zr4ov2z (5)', 'zero', 'Negro', 1757),
 ('ov2zr4ov2zr4ov2z', 'classic', 'Negro', 1730),
 ('ti22tfti22tfti22 (1)', 'oxford-negro', 'Negro', 1790),
 ('ti22tfti22tfti22 (2)', 'derby', 'Negro', 1789),
 ('ti22tfti22tfti22 (3)', 'oxford-cafe', 'Cafe', 1790),
 ('ti22tfti22tfti22 (4)', 'derby', 'Cafe', 1790),
 ('ti22tfti22tfti22 (5)', 'shelby', 'Gris', 1790),
 ('ti22tfti22tfti22', 'shelby', 'Cafe', 1790),
 ('txs6lftxs6lftxs6 (1)', 'viper', 'Cafe', 1568),
 ('txs6lftxs6lftxs6 (2)', 'viper', 'Negro', 1663),
 ('txs6lftxs6lftxs6 (3)', 'shadow', 'Negro', 1602),
 ('txs6lftxs6lftxs6', 'thunder', 'Nuez', 1644),
]
products = {}
for stem, key, color, bottom in rows:
    formal = key.startswith('oxford') or key == 'derby'
    price = 350 if key in ['mustang', 'rockstar', 'shelby', 'luca', 'oxford-negro'] else 300 if formal else 320
    sole = 'Caucho/goma' if formal else 'Super ligeras antideslizantes' if key in ['shelby', 'luca'] else 'Super ligeras'
    lining = 'Piel de res' if formal else 'Piel de res badana' if key == 'shelby' else 'Piel de res y esponja'
    details = 'Cordones encerados.' if not formal and key not in ['shelby', 'luca'] else ''
    if key in ['mustang', 'rockstar', 'thunder', 'viper']: details += ' Cierre metalico.'
    if key == 'shadow': details += ' Hebilla metalica.'
    if key == 'luca': details = 'Elastico reforzado trenzado.'
    if key == 'shelby': details = 'Negro en cuero liso; gris y cafe en cuero volcado.'
    name = key.replace('-', ' ').title()
    material = '100% cuero combinado' if key == 'viper' else '100% cuero'
    product = products.setdefault(key, {
        'key': key, 'name': name, 'price': str(price),
        'category': 'oxford' if key.startswith('oxford') else 'derby' if formal else 'botines',
        'material': material, 'sole': sole, 'insole': 'Piel de res y acolchado', 'lining': lining,
        'details': details.strip(),
        'description': f'{name}, elaborado en {material.lower()}, con plantas {sole.lower()}, plantilla interna de piel de res y acolchado, y forro de {lining.lower()}.',
        'announcedSizes': list(range(38 if formal or key in ['shelby', 'luca'] else 37, 43 if formal or key == 'shelby' else 44)),
        'photos': [],
    })
    source = SOURCE / f'Gemini_Generated_Image_{stem}.jpg'
    destination = f'{key}/{color.lower().replace(" ", "-")}.webp'
    target = OUT / 'photos' / destination
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as im:
        # Mustang negro has a black frame; remove only the side margins.
        bounds = (140, 0, 1650, bottom) if stem == 'bjh6hebjh6hebjh6' else (0, 0, im.width, bottom)
        cropped = ImageOps.exif_transpose(im).crop(bounds)
        cropped.thumbnail((1400, 1400), Image.Resampling.LANCZOS)
        cropped.save(target, 'WEBP', quality=88, method=6)
    product['photos'].append({
        'file': destination, 'color': color, 'alt': f'{name} - {color}',
        'source': source.name, 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'crop': list(bounds),
    })
manifest = {'version': 1, 'reviewedOn': '2026-11-22', 'availabilityConfirmed': False,
            'decisions': ['Oxford Negro Bs 350 y Oxford Cafe Bs 300 separados por confirmacion del usuario.',
                          'Colores de Luca y Shelby confirmados por el usuario.',
                          'Derby Clasico negro y Derby cafe agrupados: mismo precio y caracteristicas.',
                          'Rangos anunciados; ninguna disponibilidad inferida de las fotos.'],
            'products': list(products.values())}
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(f'{len(products)} models, {len(rows)} photos; originals preserved.')
