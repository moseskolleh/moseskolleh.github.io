#!/usr/bin/env python3
# ===================================================================
# BUILD IMAGES — every photo as light as it can be and still look the same
#
#     npm run images              re-encode, write the copies and
#                                 assets/img/manifest.json
#     npm run images -- --plan    say what it would do; write nothing
#
# Three things, each held to one test of likeness (below):
#
#   · Every WebP in assets/img/ is re-encoded at the lowest quality that
#     still looks like the photo as first committed, and replaced where
#     that is at least MIN_RECODE smaller. Most of them had been saved at
#     a higher quality than anyone can see; every browser, old or new,
#     downloads the difference.
#   · Each of the hero's four photos gets an 800px copy, as AVIF
#     (<name>-hero-800.avif), which style.css draws in a window under
#     600px wide. A phone was fetching the 1600px photo a desktop does,
#     about half its first view, to draw behind an overlay that lets at
#     most 22% of it through. A browser that does not read AVIF gets the
#     full-size WebP there, as every phone did before: an 800px WebP as
#     like its source weighs 69–88 KB, and four of them (0.31 MB) would
#     not fit the repository's image budget beside the rest.
#   · An AVIF copy of a photo (<name>.avif) where it is at least MIN_AVIF
#     smaller than the WebP a browser would otherwise be sent, for the
#     photos a visit to the homepage draws (AVIF_FOR): the hero's and the
#     portrait. index.html and style.css offer it to a browser that reads
#     AVIF, the WebP to one that does not. Measured this way, AVIF seldom
#     pays on a photo that was a WebP already, re-encoded to the same
#     likeness: of the 31 other photos (the case studies' and the project
#     cards'), 4 came out a tenth lighter as AVIF (October 2026), 32 KB
#     between them for a reader who opened all four of their rows, and
#     copies of them (0.23 MB) would not fit the image budget.
#
# HOW ALIKE IS ALIKE ENOUGH. SSIM (Wang et al., 2004) of the luma (Rec. 601
# weights on the 8-bit sRGB values), with the standard 11×11 Gaussian
# window, σ 1.5, against the original as decoded: for an 800px copy, the
# original resized to 800px (Lanczos), so the score is the encoding's,
# not the resizing's. A photo with transparency (the portrait) is scored
# over black, over white and on its alpha, and the lowest counts. Every
# file must score at least THRESHOLD, 0.98: looked at side by side at
# twice their size, copies at 0.98 could not be told from the original,
# while at 0.97 the finest texture (foliage, a drilling rig's splash) had
# begun to smooth. Each must also keep every colour channel's mean within
# COLOUR_SHIFT levels of the original's, which SSIM on luma would not see.
# How a phone copy looks as drawn was checked once, when they were made,
# and nothing checks it again: the hero with its words hidden, at 390×844
# and three device pixels to the CSS pixel, scored an SSIM of 0.9975 (dark
# theme) and 0.9981 (light) against the same with the original, about a
# fifth of a level apart on average.
#
# THE ORIGINALS stay in git. A re-encoded WebP's original is the blob
# manifest.json names, read back with `git cat-file`, so running this
# again starts from the same pixels rather than re-encoding a re-encode.
# A photo this has not seen yet is its own original, and must be committed
# first so that its original stays in the history.
#
# Needs Python 3 with Pillow 11.2 or later (WebP and AVIF) and numpy, and
# git. tests/images.test.js checks the result without any of them: every
# file is the one the manifest describes, scored at or above THRESHOLD,
# and every copy is drawn by a page.
# ===================================================================

import argparse
import hashlib
import io
import json
import os
import subprocess
import sys
from multiprocessing import Pool

import numpy as np
from PIL import Image, features

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = 'assets/img'
MANIFEST = f'{IMG}/manifest.json'

THRESHOLD = 0.98      # SSIM every file must reach against its original
COLOUR_SHIFT = 1.0    # most a channel's mean may move, in 8-bit levels
MIN_RECODE = 0.05     # replace a WebP only if this much smaller
MIN_AVIF = 0.10       # keep an AVIF copy only if this much smaller than its WebP
PHONE_WIDTH = 800     # the hero's copy for a window under 600px
QUALITIES = (30, 95)  # the range searched, both encoders
AVIF_FOR = lambda name: name.endswith('-hero.webp') or name == 'profile.webp'
WEBP_OPTIONS = {'method': 6}
AVIF_OPTIONS = {'speed': 4, 'max_threads': 1}


# ------------------------------------------------------------------
# Likeness
# ------------------------------------------------------------------
def _gauss(sigma=1.5, size=11):
    x = np.arange(size) - size // 2
    g = np.exp(-(x ** 2) / (2 * sigma ** 2))
    return g / g.sum()


_G = _gauss()


def _blur(a):
    n = len(_G)
    h, w = a.shape
    rows = sum(_G[k] * a[:, k:k + w - n + 1] for k in range(n))
    return sum(_G[k] * rows[k:k + h - n + 1, :] for k in range(n))


def _ssim(x, y):
    c1, c2 = (0.01 * 255) ** 2, (0.03 * 255) ** 2
    mx, my = _blur(x), _blur(y)
    sxx = _blur(x * x) - mx * mx
    syy = _blur(y * y) - my * my
    sxy = _blur(x * y) - mx * my
    m = ((2 * mx * my + c1) * (2 * sxy + c2)) / ((mx * mx + my * my + c1) * (sxx + syy + c2))
    return float(m.mean())


def _luma(rgb):
    return 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]


def _over(im, background):
    """An image's RGB as floats, composited over a flat colour if it has alpha."""
    a = np.asarray(im.convert('RGBA'), dtype=np.float64)
    alpha = a[..., 3:4] / 255
    return a[..., :3] * alpha + background * (1 - alpha)


def likeness(original, copy):
    """(SSIM, colour shift) of a copy against its original, as the header says."""
    scores, shifts = [], []
    backgrounds = [0, 255] if original.mode == 'RGBA' else [0]
    for bg in backgrounds:
        a, b = _over(original, bg), _over(copy, bg)
        scores.append(_ssim(_luma(a), _luma(b)))
        shifts.append(float(np.abs(a.mean(axis=(0, 1)) - b.mean(axis=(0, 1))).max()))
    if original.mode == 'RGBA':
        alpha = lambda im: np.asarray(im.convert('RGBA'), dtype=np.float64)[..., 3]
        scores.append(_ssim(alpha(original), alpha(copy)))
    return min(scores), max(shifts)


# ------------------------------------------------------------------
# Encoding
# ------------------------------------------------------------------
def encode(im, fmt, quality, icc):
    options = dict(WEBP_OPTIONS if fmt == 'WEBP' else AVIF_OPTIONS)
    if icc:
        options['icc_profile'] = icc
    out = io.BytesIO()
    im.save(out, fmt, quality=quality, **options)
    data = out.getvalue()
    decoded = Image.open(io.BytesIO(data))
    decoded.load()
    return data, decoded.convert(im.mode)


def lightest(im, fmt, icc):
    """The lowest quality whose likeness reaches the threshold, or None."""
    found, cache = None, {}

    def at(q):
        if q not in cache:
            data, decoded = encode(im, fmt, q, icc)
            cache[q] = (data,) + likeness(im, decoded)
        return cache[q]

    lo, hi = QUALITIES
    while lo <= hi:
        q = (lo + hi) // 2
        data, score, shift = at(q)
        if score >= THRESHOLD and shift <= COLOUR_SHIFT:
            found, hi = (q, data, score, shift), q - 1
        else:
            lo = q + 1
    return found


# ------------------------------------------------------------------
# Originals
# ------------------------------------------------------------------
def git(*args, binary=False):
    out = subprocess.run(['git', *args], cwd=ROOT, capture_output=True, check=True)
    return out.stdout if binary else out.stdout.decode().strip()


def original_of(name, previous):
    """(blob id, bytes) of a photo as first committed."""
    rel = f'{IMG}/{name}'
    entry = previous.get(rel)
    if entry:
        blob = entry['original']['blob']
        return blob, git('cat-file', 'blob', blob, binary=True)
    blob = git('hash-object', rel)
    try:
        committed = git('rev-parse', f'HEAD:{rel}')
    except subprocess.CalledProcessError:
        committed = None
    if committed != blob:
        sys.exit(f'  {rel} is not committed as it is: commit the new photo first, so its original stays in the history.')
    with open(os.path.join(ROOT, rel), 'rb') as f:
        return blob, f.read()


# ------------------------------------------------------------------
# One photo
# ------------------------------------------------------------------
def sha256(data):
    return hashlib.sha256(data).hexdigest()


def record(rel, im, found, against=None):
    q, data, score, shift = found
    out = {'file': rel, 'width': im.width, 'height': im.height, 'quality': q, 'bytes': len(data),
           'sha256': sha256(data), 'ssim': round(score, 4), 'colourShift': round(shift, 2)}
    if against:
        out['against'] = against[0]
        out['saves'] = round(1 - len(data) / against[1], 3)
    return out, data


def build(job):
    name, blob, original = job
    rel = f'{IMG}/{name}'
    src = Image.open(io.BytesIO(original))
    icc = src.info.get('icc_profile')
    im = src.convert('RGBA' if src.mode == 'RGBA' else 'RGB')
    stem = name[:-len('.webp')]
    entry = {'file': rel, 'original': {'blob': blob, 'bytes': len(original), 'sha256': sha256(original),
                                       'width': im.width, 'height': im.height}}
    writes, passed = {}, []

    # The WebP, re-encoded where that is enough lighter.
    webp = lightest(im, 'WEBP', icc)
    if webp and len(webp[1]) <= (1 - MIN_RECODE) * len(original):
        entry['webp'], writes[rel] = record(rel, im, webp)
        served = len(webp[1])
    else:
        entry['webp'], writes[rel] = None, original
        served = len(original)
        passed.append({'what': 'a re-encoded WebP', 'bytes': len(webp[1]) if webp else None,
                       'why': 'not 5% lighter than the original' if webp else f'nothing up to quality {QUALITIES[1]} reached the threshold'})
    entry['served'] = {'bytes': served, 'sha256': entry['webp']['sha256'] if entry['webp'] else sha256(original)}

    copies = []
    if AVIF_FOR(name):
        avif = lightest(im, 'AVIF', icc)
        if avif and len(avif[1]) <= (1 - MIN_AVIF) * served:
            copy, data = record(f'{IMG}/{stem}.avif', im, avif, (rel, served))
            copies.append(copy)
            writes[copy['file']] = data
        else:
            saves = round(100 * (1 - len(avif[1]) / served)) if avif else None
            passed.append({'what': 'an AVIF copy', 'bytes': len(avif[1]) if avif else None,
                           'why': 'nothing reached the threshold' if not avif
                           else f'{saves}% lighter than the WebP, under {round(100 * MIN_AVIF)}%' if saves >= 0
                           else f'{-saves}% heavier than the WebP'})

    # The hero's phone copy, AVIF, scored against the original at its size.
    if name.endswith('-hero.webp'):
        small = im.resize((PHONE_WIDTH, round(im.height * PHONE_WIDTH / im.width)), Image.LANCZOS)
        avif = lightest(small, 'AVIF', icc)
        if not avif:
            sys.exit(f'  {rel}: no 800px AVIF reached the threshold')
        alt = lightest(small, 'WEBP', icc)
        copy, data = record(f'{IMG}/{stem}-{PHONE_WIDTH}.avif', small, avif, (rel, served))
        # What an 800px WebP as like it would weigh: the copy not made.
        copy['webpWouldBe'] = len(alt[1]) if alt else None
        copies.append(copy)
        writes[copy['file']] = data

    entry['copies'] = copies
    entry['notMade'] = passed
    return entry, writes


# ------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description='Re-encode the photos and write their AVIF and phone copies.')
    ap.add_argument('--plan', action='store_true', help='say what would change; write nothing')
    args = ap.parse_args()
    if not (features.check('webp') and features.check('avif')):
        sys.exit('  Pillow needs WebP and AVIF support (Pillow 11.2 or later).')

    path = os.path.join(ROOT, MANIFEST)
    before = json.load(open(path)) if os.path.exists(path) else {'images': []}
    previous = {e['file']: e for e in before['images']}
    names = sorted(f for f in os.listdir(os.path.join(ROOT, IMG)) if f.endswith('.webp'))
    jobs = [(n,) + original_of(n, previous) for n in names]
    jobs.sort(key=lambda j: -len(j[2]))

    with Pool(max(1, (os.cpu_count() or 2) - 1)) as pool:
        results = pool.map(build, jobs)
    results.sort(key=lambda r: r[0]['file'])

    manifest = {
        'about': 'Written by scripts/build-images.py (npm run images). Do not edit by hand.',
        'likeness': {'metric': 'SSIM of luma (Rec. 601), 11x11 Gaussian window, sigma 1.5, against the original as decoded',
                     'threshold': THRESHOLD, 'colourShift': COLOUR_SHIFT},
        'rules': {'minRecode': MIN_RECODE, 'minAvif': MIN_AVIF, 'phoneWidth': PHONE_WIDTH, 'qualities': list(QUALITIES),
                  'webp': WEBP_OPTIONS, 'avif': {k: v for k, v in AVIF_OPTIONS.items() if k != 'max_threads'}},
        'encoders': {'pillow': Image.__version__, 'libwebp': features.version('webp'), 'libavif': features.version('avif')},
        'images': [r[0] for r in results],
    }

    old = {c['file'] for e in before['images'] for c in e.get('copies', [])}
    new = {c['file'] for r in results for c in r[0]['copies']}
    total_before = sum(os.path.getsize(os.path.join(ROOT, r[0]['file'])) for r in results)
    total_after = sum(r[0]['served']['bytes'] for r in results)
    for entry, _ in results:
        line = f"  {entry['file'][len(IMG) + 1:]:36} {entry['original']['bytes']:>7} →"
        line += f" {entry['webp']['bytes']:>7} (q{entry['webp']['quality']}, {entry['webp']['ssim']:.4f})" if entry['webp'] else f" {'as is':>7}"
        for c in entry['copies']:
            line += f"   {c['file'][len(IMG) + 1:]} {c['bytes']} (q{c['quality']}, {c['ssim']:.4f}, {round(100 * c['saves'])}% less)"
        print(line)
    print(f'\n  WebPs: {total_before} → {total_after} bytes; copies: {sum(c["bytes"] for r in results for c in r[0]["copies"])} bytes in {len(new)} files')
    if args.plan:
        print('  --plan: nothing written.')
        return
    for _, writes in results:
        for rel, data in writes.items():
            with open(os.path.join(ROOT, rel), 'wb') as f:
                f.write(data)
    for rel in old - new:
        os.remove(os.path.join(ROOT, rel))
    with open(path, 'w') as f:
        f.write(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
    print(f'  Wrote {MANIFEST}. Commit the images and the manifest together.')


if __name__ == '__main__':
    main()
