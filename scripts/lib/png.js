'use strict';
// ===================================================================
// PNG — a screenshot made small: a palette of at most 256 colours
//
// Chromium saves a screenshot as a truecolour PNG, three bytes a pixel.
// A preview card (scripts/build-og.js) is flat colour and anti-aliased
// text, a few hundred colours in all, so the same picture as an indexed
// PNG, one byte a pixel and a palette, comes to about a third of the
// size. Node's zlib is all it needs: this reads the 8-bit, non-interlaced
// RGB or RGBA PNG Chromium writes, and writes it back indexed.
//
// Where a card holds more than 256 colours (the edges of text are
// blended into the background), each channel is rounded to a coarser
// step, 2, then 4, until it fits. The steps are smaller than an eye can
// tell apart on an anti-aliased edge; a flat colour moves by at most 2
// of 255.
// ===================================================================

const zlib = require('zlib');

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** The pixels of an 8-bit, non-interlaced RGB (2) or RGBA (6) PNG, unfiltered. */
function decode(buf) {
    if (!buf.slice(0, 8).equals(SIGNATURE)) throw new Error('not a PNG');
    let pos = 8;
    let head = null;
    const idat = [];
    while (pos < buf.length) {
        const len = buf.readUInt32BE(pos);
        const type = buf.toString('ascii', pos + 4, pos + 8);
        const data = buf.slice(pos + 8, pos + 8 + len);
        if (type === 'IHDR') head = { width: data.readUInt32BE(0), height: data.readUInt32BE(4), depth: data[8], colour: data[9], interlace: data[12] };
        else if (type === 'IDAT') idat.push(data);
        pos += 12 + len;
    }
    if (!head || head.depth !== 8 || ![2, 6].includes(head.colour) || head.interlace) {
        throw new Error('only 8-bit, non-interlaced RGB or RGBA PNGs are read');
    }
    const bpp = head.colour === 6 ? 4 : 3;
    const stride = head.width * bpp;
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const out = Buffer.alloc(head.height * stride);
    for (let y = 0; y < head.height; y++) {
        const filter = raw[y * (stride + 1)];
        const line = y * (stride + 1) + 1;
        const at = y * stride;
        for (let x = 0; x < stride; x++) {
            const a = x >= bpp ? out[at + x - bpp] : 0;
            const b = y ? out[at - stride + x] : 0;
            const c = x >= bpp && y ? out[at - stride + x - bpp] : 0;
            let v = raw[line + x];
            if (filter === 1) v += a;
            else if (filter === 2) v += b;
            else if (filter === 3) v += (a + b) >> 1;
            else if (filter === 4) {
                const p = a + b - c;
                const pa = Math.abs(p - a);
                const pb = Math.abs(p - b);
                const pc = Math.abs(p - c);
                v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
            }
            out[at + x] = v & 255;
        }
    }
    return { width: head.width, height: head.height, bpp, pixels: out };
}

function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
}

/**
 * The same picture as an indexed PNG. Opaque only: a pixel that is not is
 * refused, as a card has none.
 */
function indexed(png) {
    const { width, height, bpp, pixels } = decode(png);
    for (let step = 1; step <= 16; step *= 2) {
        const round = (v) => Math.min(255, Math.round(v / step) * step);
        const palette = new Map();
        const index = Buffer.alloc(height * (width + 1));
        let fits = true;
        for (let y = 0; y < height && fits; y++) {
            index[y * (width + 1)] = 0;   // no filter: the rows of a flat card repeat, which is what zlib looks for
            for (let x = 0; x < width; x++) {
                const p = (y * width + x) * bpp;
                if (bpp === 4 && pixels[p + 3] !== 255) throw new Error('a card has no transparent pixel');
                const key = (round(pixels[p]) << 16) | (round(pixels[p + 1]) << 8) | round(pixels[p + 2]);
                let i = palette.get(key);
                if (i === undefined) {
                    if (palette.size === 256) { fits = false; break; }
                    i = palette.size;
                    palette.set(key, i);
                }
                index[y * (width + 1) + 1 + x] = i;
            }
        }
        if (!fits) continue;
        const ihdr = Buffer.alloc(13);
        ihdr.writeUInt32BE(width, 0);
        ihdr.writeUInt32BE(height, 4);
        ihdr[8] = 8;     // bits per index
        ihdr[9] = 3;     // indexed colour
        const plte = Buffer.alloc(palette.size * 3);
        Array.from(palette.keys()).forEach((key, i) => { plte[i * 3] = key >> 16; plte[i * 3 + 1] = (key >> 8) & 255; plte[i * 3 + 2] = key & 255; });
        return {
            png: Buffer.concat([SIGNATURE, chunk('IHDR', ihdr), chunk('PLTE', plte), chunk('IDAT', zlib.deflateSync(index, { level: 9 })), chunk('IEND', Buffer.alloc(0))]),
            colours: palette.size,
            step
        };
    }
    throw new Error('more than 256 colours, even rounded to steps of 16');
}

module.exports = { decode, indexed };
