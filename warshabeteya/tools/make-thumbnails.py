"""Optional maintenance tool: pip install Pillow; python tools/make-thumbnails.py.
Original photos are never overwritten. Run from anywhere.
"""
from pathlib import Path
from PIL import Image, ImageOps
root = Path(__file__).resolve().parents[1]
output = root / 'demos' / 'thumbs'
output.mkdir(exist_ok=True)
for source in (root / 'demos').glob('*.jpeg'):
    with Image.open(source) as original:
        thumbnail = ImageOps.exif_transpose(original).convert('RGB')
        thumbnail.thumbnail((640, 640))
        thumbnail.save(output / (source.stem + '.webp'), quality=82)
        print(source.name, '->', thumbnail.size)
