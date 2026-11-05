// 1-bit black and white PDF builder: CCITT Group 4 (T.6) encoder + minimal PDF writer.
// Same output as tools/bitonal-pdf.sh (threshold -> Group 4 -> one image per page).

const WT = ["00110101","000111","0111","1000","1011","1100","1110","1111","10011","10100","00111","01000","001000","000011","110100","110101","101010","101011","0100111","0001100","0001000","0010111","0000011","0000100","0101000","0101011","0010011","0100100","0011000","00000010","00000011","00011010","00011011","00010010","00010011","00010100","00010101","00010110","00010111","00101000","00101001","00101010","00101011","00101100","00101101","00000100","00000101","00001010","00001011","01010010","01010011","01010100","01010101","00100100","00100101","01011000","01011001","01011010","01011011","01001010","01001011","00110010","00110011","00110100"];
const WM = ["11011","10010","010111","0110111","00110110","00110111","01100100","01100101","01101000","01100111","011001100","011001101","011010010","011010011","011010100","011010101","011010110","011010111","011011000","011011001","011011010","011011011","010011000","010011001","010011010","011000","010011011"];
const BT = ["0000110111","010","11","10","011","0011","0010","00011","000101","000100","0000100","0000101","0000111","00000100","00000111","000011000","0000010111","0000011000","0000001000","00001100111","00001101000","00001101100","00000110111","00000101000","00000010111","00000011000","000011001010","000011001011","000011001100","000011001101","000001101000","000001101001","000001101010","000001101011","000011010010","000011010011","000011010100","000011010101","000011010110","000011010111","000001101100","000001101101","000011011010","000011011011","000001010100","000001010101","000001010110","000001010111","000001100100","000001100101","000001010010","000001010011","000000100100","000000110111","000000111000","000000100111","000000101000","000001011000","000001011001","000000101011","000000101100","000001011010","000001100110","000001100111"];
const BM = ["0000001111","000011001000","000011001001","000001011011","000000110011","000000110100","000000110101","0000001101100","0000001101101","0000001001010","0000001001011","0000001001100","0000001001101","0000001110010","0000001110011","0000001110100","0000001110101","0000001110110","0000001110111","0000001010010","0000001010011","0000001010100","0000001010101","0000001011010","0000001011011","0000001100100","0000001100101"];
const XM = ["00000001000","00000001100","00000001101","000000010010","000000010011","000000010100","000000010101","000000010110","000000010111","000000011100","000000011101","000000011110","000000011111"];
const V = { "-3": "0000010", "-2": "000010", "-1": "010", "0": "1", "1": "011", "2": "000011", "3": "0000011" };
const toCode = s => [parseInt(s, 2), s.length];
const wt = WT.map(toCode), wm = WM.map(toCode), bt = BT.map(toCode), bm = BM.map(toCode), xm = XM.map(toCode);
const vc = {}; for (const k in V) vc[k] = toCode(V[k]);
const PASS = toCode("0001"), HORIZ = toCode("001"), EOL = toCode("000000000001");

class Bits {
  constructor(n) { this.buf = new Uint8Array(n); this.pos = 0; this.acc = 0; this.nb = 0; }
  put([code, len]) {
    this.acc = (this.acc << len) | code; this.nb += len;
    while (this.nb >= 8) {
      this.nb -= 8;
      if (this.pos >= this.buf.length) { const b = new Uint8Array(this.buf.length * 2); b.set(this.buf); this.buf = b; }
      this.buf[this.pos++] = (this.acc >>> this.nb) & 255;
    }
    this.acc &= (1 << this.nb) - 1;
  }
  done() { if (this.nb) this.put([0, 8 - this.nb]); return this.buf.subarray(0, this.pos); }
}

function run(out, n, black) {
  const t = black ? bt : wt, m = black ? bm : wm;
  while (n >= 2624) { out.put(xm[12]); n -= 2560; }        // 2560 makeup, repeated
  if (n >= 64) {
    const k = n >> 6;                                      // multiple of 64
    out.put(k <= 27 ? m[k - 1] : xm[k - 28]);
    n -= k << 6;
  }
  out.put(t[n]);
}

// black: Uint8Array w*h, 1 = black. Returns Group 4 bytes (K=-1, BlackIs1 false, EncodedByteAlign false).
export function encodeG4(black, w, h) {
  const out = new Bits(Math.max(1024, (w * h) >> 4));
  let ref = new Int32Array(w + 3), cur = new Int32Array(w + 3);
  let rn = 0; ref[0] = w; ref[1] = w;                       // imaginary all-white reference line
  for (let y = 0; y < h; y++) {
    // changing elements of this line (color before x=0 is white)
    let n = 0, c = 0, row = y * w;
    for (let x = 0; x < w; x++) { const p = black[row + x]; if (p !== c) { cur[n++] = x; c = p; } }
    cur[n] = w; cur[n + 1] = w; cur[n + 2] = w;
    let a0 = -1, color = 0, ia = 0, ib = 0;
    while (a0 < w) {
      while (ia < n && cur[ia] <= a0) ia++;
      const a1 = cur[ia], a2 = cur[ia + 1];
      // b1: first change on ref right of a0 whose colour is opposite to a0's colour (even index = to black)
      while (ib < rn && (ref[ib] <= a0 || (ib & 1) !== color)) ib++;
      const b1 = ib < rn ? ref[ib] : w, b2 = ib + 1 < rn ? ref[ib + 1] : w;
      if (b2 < a1) { out.put(PASS); a0 = b2; continue; }
      const d = a1 - b1;
      if (d >= -3 && d <= 3) { out.put(vc[d]); a0 = a1; color ^= 1; ia++; }
      else {
        out.put(HORIZ);
        const s = a0 < 0 ? 0 : a0;
        run(out, a1 - s, color === 1); run(out, a2 - a1, color === 0);
        a0 = a2; ia += 2;
      }
      // b1 search must restart near a0 (it can move left in vertical-left cases)
      while (ib > 0 && ref[ib - 1] > a0) ib--;
    }
    const t = ref; ref = cur; cur = t; rn = n;
  }
  out.put(EOL); out.put(EOL);
  return out.done();
}

// gray: RGBA Uint8ClampedArray; threshold 0..100 like ImageMagick -threshold N%
export function binarize(rgba, w, h, threshold) {
  const lim = threshold * 2.55, b = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < b.length; i++, j += 4) {
    b[i] = (rgba[j] * 0.299 + rgba[j + 1] * 0.587 + rgba[j + 2] * 0.114) <= lim ? 1 : 0;
  }
  return b;
}

// pages: [{ data: Uint8Array (G4), w, h, ptW, ptH }]
export function buildPdf(pages) {
  const enc = new TextEncoder(), chunks = [], offs = [];
  let len = 0;
  const add = x => { const u = typeof x === "string" ? enc.encode(x) : x; chunks.push(u); len += u.length; };
  const obj = (id, body, stream) => {
    offs[id] = len;
    add(`${id} 0 obj\n${body}\n`);
    if (stream) { add("stream\n"); add(stream); add("\nendstream\n"); }
    add("endobj\n");
  };
  add("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(" ");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  pages.forEach((p, i) => {
    const id = 3 + i * 3, W = p.ptW.toFixed(2), H = p.ptH.toFixed(2);
    const content = enc.encode(`q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`);
    obj(id, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 ${id + 2} 0 R >> >> /Contents ${id + 1} 0 R >>`);
    obj(id + 1, `<< /Length ${content.length} >>`, content);
    obj(id + 2, `<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceGray /BitsPerComponent 1 /Filter /CCITTFaxDecode /DecodeParms << /K -1 /Columns ${p.w} /Rows ${p.h} /BlackIs1 false >> /Length ${p.data.length} >>`, p.data);
  });
  const n = 3 + pages.length * 3, xref = len;
  let x = `xref\n0 ${n}\n0000000000 65535 f \n`;
  for (let i = 1; i < n; i++) x += String(offs[i]).padStart(10, "0") + " 00000 n \n";
  add(x + `trailer\n<< /Size ${n} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(chunks, { type: "application/pdf" });
}
