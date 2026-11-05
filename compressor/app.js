import * as pdfjs from "./pdf.min.mjs";
import { encodeG4, binarize, buildPdf } from "./bw.js?v=1";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("./pdf.worker.min.mjs", import.meta.url).href;

const $ = id => document.getElementById(id);
const drop = $("drop"), input = $("file"), dpiSel = $("dpi"), thr = $("thr");
const MAX_PIXELS = 16e6;                       // stay under Safari's canvas limit
let file = null, job = 0, firstPage = null, url = null;

const fmt = n => n < 1024 * 1024 ? (n / 1024).toFixed(0) + " KB" : (n / 1048576).toFixed(1) + " MB";

function showPreview() {
  if (!firstPage) return;
  const { rgba, w, h } = firstPage, cv = $("preview"), ctx = cv.getContext("2d");
  cv.width = w; cv.height = h;
  const b = binarize(rgba, w, h, +thr.value), img = ctx.createImageData(w, h), d = img.data;
  for (let i = 0, j = 0; i < b.length; i++, j += 4) { const v = b[i] ? 0 : 255; d[j] = d[j + 1] = d[j + 2] = v; d[j + 3] = 255; }
  ctx.putImageData(img, 0, 0);
}

async function compress() {
  if (!file) return;
  const my = ++job, dpi = +dpiSel.value, t = +thr.value;
  $("result").hidden = false; $("dl").hidden = true; $("sizes").textContent = ""; $("bar").style.width = "0";
  $("status").textContent = "Reading…";
  let doc;
  try { doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise; }
  catch (e) { $("status").textContent = "This file could not be opened as a PDF."; return; }
  const pages = [], canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  for (let i = 1; i <= doc.numPages; i++) {
    if (my !== job) { doc.destroy(); return; }
    $("status").textContent = `Page ${i} / ${doc.numPages}`;
    const page = await doc.getPage(i), base = page.getViewport({ scale: 1 });
    let scale = dpi / 72;
    const px = base.width * base.height * scale * scale;
    if (px > MAX_PIXELS) scale *= Math.sqrt(MAX_PIXELS / px);
    const vp = page.getViewport({ scale });
    const w = Math.max(1, Math.round(vp.width)), h = Math.max(1, Math.round(vp.height));
    canvas.width = w; canvas.height = h;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
    await page.render({ canvasContext: ctx, viewport: vp, background: "#ffffff" }).promise;
    const rgba = ctx.getImageData(0, 0, w, h).data;
    if (i === 1) { firstPage = { rgba, w, h }; showPreview(); }
    pages.push({ data: encodeG4(binarize(rgba, w, h, t), w, h), w, h, ptW: base.width, ptH: base.height });
    page.cleanup();
    $("bar").style.width = (100 * i / doc.numPages) + "%";
    await new Promise(r => setTimeout(r));
  }
  doc.destroy();
  if (my !== job) return;
  const blob = buildPdf(pages);
  if (url) URL.revokeObjectURL(url);
  url = URL.createObjectURL(blob);
  const a = $("dl");
  a.href = url; a.download = file.name.replace(/\.pdf$/i, "") + "-bw.pdf"; a.hidden = false;
  $("status").textContent = `${doc.numPages} page${doc.numPages > 1 ? "s" : ""}`;
  $("sizes").textContent = `${fmt(file.size)} → ${fmt(blob.size)}`;
}

function take(f) {
  if (!f) return;
  file = f; firstPage = null;
  $("fname").textContent = f.name;
  compress();
}

input.addEventListener("change", () => take(input.files[0]));
["dragenter", "dragover"].forEach(e => drop.addEventListener(e, ev => { ev.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach(e => drop.addEventListener(e, ev => { ev.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", ev => take(ev.dataTransfer.files[0]));
window.addEventListener("dragover", e => e.preventDefault());
window.addEventListener("drop", e => { e.preventDefault(); if (!drop.contains(e.target)) take(e.dataTransfer.files[0]); });

thr.addEventListener("input", () => { $("thrv").textContent = thr.value; showPreview(); });
thr.addEventListener("change", compress);
dpiSel.addEventListener("change", compress);
