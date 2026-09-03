const A4 = Object.freeze({ width: 595.28, height: 841.89 });
const PAGE_MARGIN = 24;
const BLOCK_GAP = 12;
const PDF_CONTENT_WIDTH = A4.width - PAGE_MARGIN * 2;
const PDF_CONTENT_HEIGHT = A4.height - PAGE_MARGIN * 2;

let librariesPromise = null;

function loadVendorScript(relativePath, globalName) {
  if (window[globalName]) return Promise.resolve();
  const source = new URL(relativePath, import.meta.url).href;
  const existing = document.querySelector(`script[data-pdf-vendor="${globalName}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', () => reject(new Error(`${globalName} 加载失败`)), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = source;
    script.async = true;
    script.dataset.pdfVendor = globalName;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error(`${globalName} 加载失败`)), { once: true });
    document.head.append(script);
  });
}

function ensurePdfLibraries() {
  if (!librariesPromise) {
    librariesPromise = Promise.all([
      loadVendorScript('./vendor/html2canvas.min.js', 'html2canvas'),
      loadVendorScript('./vendor/pdf-lib.min.js', 'PDFLib'),
    ]).then(() => {
      if (!window.html2canvas || !window.PDFLib?.PDFDocument) throw new Error('PDF 组件未正确加载');
    });
  }
  return librariesPromise;
}

function canvasToJpegBytes(canvas, quality = 0.9) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('报告图片生成失败'));
        return;
      }
      resolve(new Uint8Array(await blob.arrayBuffer()));
    }, 'image/jpeg', quality);
  });
}

function safeFileName(value) {
  return String(value || '万成云商')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 70);
}

function todayStamp() {
  const date = new Date();
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('');
}

async function waitForImages(scope) {
  const images = [...scope.querySelectorAll('img')];
  await Promise.all(images.map(async (image) => {
    if (image.complete && image.naturalWidth) return;
    try {
      await image.decode();
    } catch {
      await new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
        window.setTimeout(resolve, 5000);
      });
    }
  }));
}

function createSliceCanvas(source, top, height) {
  const slice = document.createElement('canvas');
  slice.width = source.width;
  slice.height = height;
  const context = slice.getContext('2d', { alpha: false });
  if (!context) throw new Error('当前浏览器无法生成 PDF 画布');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, slice.width, slice.height);
  context.drawImage(source, 0, top, source.width, height, 0, 0, source.width, height);
  return slice;
}

async function addCanvasToPdf(state, canvas) {
  const { pdfDocument } = state;
  const pixelsPerPoint = canvas.width / PDF_CONTENT_WIDTH;
  const fullHeightPoints = canvas.height / pixelsPerPoint;

  if (fullHeightPoints <= PDF_CONTENT_HEIGHT) {
    if (!state.page || state.cursorTop + fullHeightPoints > A4.height - PAGE_MARGIN) state.newPage();
    const imageBytes = await canvasToJpegBytes(canvas);
    const image = await pdfDocument.embedJpg(imageBytes);
    state.page.drawImage(image, {
      x: PAGE_MARGIN,
      y: A4.height - state.cursorTop - fullHeightPoints,
      width: PDF_CONTENT_WIDTH,
      height: fullHeightPoints,
    });
    state.cursorTop += fullHeightPoints + BLOCK_GAP;
    return;
  }

  if (state.page && state.cursorTop > PAGE_MARGIN) state.newPage();
  const maximumSliceHeight = Math.max(1, Math.floor(PDF_CONTENT_HEIGHT * pixelsPerPoint));
  let sourceTop = 0;
  while (sourceTop < canvas.height) {
    const sliceHeight = Math.min(maximumSliceHeight, canvas.height - sourceTop);
    const slice = createSliceCanvas(canvas, sourceTop, sliceHeight);
    const imageBytes = await canvasToJpegBytes(slice);
    const image = await pdfDocument.embedJpg(imageBytes);
    const sliceHeightPoints = sliceHeight / pixelsPerPoint;
    if (!state.page || state.cursorTop + sliceHeightPoints > A4.height - PAGE_MARGIN) state.newPage();
    state.page.drawImage(image, {
      x: PAGE_MARGIN,
      y: A4.height - state.cursorTop - sliceHeightPoints,
      width: PDF_CONTENT_WIDTH,
      height: sliceHeightPoints,
    });
    state.cursorTop += sliceHeightPoints + BLOCK_GAP;
    sourceTop += sliceHeight;
    if (sourceTop < canvas.height) state.newPage();
  }
}

function reportBlocks(container) {
  return [...container.children].filter((element) => {
    if (!(element instanceof HTMLElement)) return false;
    return !element.classList.contains('no-print') && !element.hidden;
  });
}

async function captureReportBlock(element) {
  const lowMemoryDevice = Number(navigator.deviceMemory || 4) <= 2;
  return window.html2canvas(element, {
    allowTaint: false,
    backgroundColor: '#ffffff',
    imageTimeout: 7000,
    logging: false,
    removeContainer: true,
    scale: lowMemoryDevice ? 1 : 1.15,
    scrollX: 0,
    scrollY: -window.scrollY,
    useCORS: true,
    windowHeight: Math.max(document.documentElement.scrollHeight, 900),
    windowWidth: 1200,
    onclone: (clonedDocument) => {
      clonedDocument.body.style.background = '#ffffff';
      clonedDocument.querySelectorAll('.no-print').forEach((node) => node.remove());
      const shell = clonedDocument.querySelector('.full-report-page .result-shell');
      if (shell) {
        shell.style.width = '1050px';
        shell.style.maxWidth = '1050px';
      }
    },
  });
}

export async function prepareReportPdf({ container, accountName }) {
  if (!(container instanceof HTMLElement)) throw new Error('没有找到完整报告内容');
  await ensurePdfLibraries();
  await document.fonts?.ready;
  await waitForImages(container);

  const pdfDocument = await window.PDFLib.PDFDocument.create();
  pdfDocument.setTitle(`${accountName} 企业出海诊断报告`);
  pdfDocument.setAuthor('万成云商');
  pdfDocument.setCreator('万成云商企业出海决策系统');
  pdfDocument.setProducer('万成云商企业出海决策系统');

  const state = {
    pdfDocument,
    page: null,
    cursorTop: PAGE_MARGIN,
    newPage() {
      this.page = pdfDocument.addPage([A4.width, A4.height]);
      this.cursorTop = PAGE_MARGIN;
    },
  };

  for (const element of reportBlocks(container)) {
    const canvas = await captureReportBlock(element);
    if (canvas.width && canvas.height) await addCanvasToPdf(state, canvas);
  }

  if (!state.page) throw new Error('完整报告内容为空');
  const bytes = await pdfDocument.save({ useObjectStreams: false });
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const fileName = `${safeFileName(accountName)}-企业出海诊断报告-${todayStamp()}.pdf`;
  return { blob, fileName };
}

function prefersSystemSave() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || Boolean(window.matchMedia?.('(pointer: coarse)')?.matches);
}

function triggerBrowserDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export async function savePreparedPdf({ blob, fileName }) {
  const file = typeof File === 'function' ? new File([blob], fileName, { type: 'application/pdf' }) : null;
  if (prefersSystemSave() && file && navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: '企业出海诊断报告',
        text: '保存完整的企业出海诊断报告',
      });
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled';
    }
  }
  triggerBrowserDownload(blob, fileName);
  return 'downloaded';
}

export function createPdfObjectUrl(blob) {
  return URL.createObjectURL(blob);
}

export function releasePdfObjectUrl(url) {
  if (url) URL.revokeObjectURL(url);
}
