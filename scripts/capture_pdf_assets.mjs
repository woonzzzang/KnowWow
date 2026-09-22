/** Capture only the UI fragments and saved notebook outputs used in the PDF. */
import {spawn} from "node:child_process";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "tmp", "pdfs");
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 9227;
const profile = "/private/tmp/knowwow-pdf-cdp";
const viewport = {width: 1600, height: 1500};

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitUntil(check, timeoutMs = 20000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    if (await check()) return;
    await pause(250);
  }
  throw new Error("Timed out while waiting for the page to finish");
}

async function connect() {
  let page;
  await waitUntil(async () => {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      page = (await response.json()).find((entry) => entry.type === "page");
      return Boolean(page);
    } catch {
      return false;
    }
  });

  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, {once: true});
    socket.addEventListener("error", reject, {once: true});
  });
  let nextId = 1;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const task = pending.get(message.id);
    if (!task) return;
    pending.delete(message.id);
    if (message.error) task.reject(new Error(message.error.message));
    else task.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, {resolve, reject});
    socket.send(JSON.stringify({id, method, params}));
  });
  return {socket, send};
}

const escapeHtml = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

async function main() {
  await mkdir(out, {recursive: true});
  const browser = spawn(chromePath, [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
    `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`,
    `--window-size=${viewport.width},${viewport.height}`, "about:blank",
  ], {stdio: "ignore"});

  let cdp;
  try {
    cdp = await connect();
    const {send} = cdp;
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {...viewport, deviceScaleFactor: 1, mobile: false});

    const evaluate = async (expression) => (await send("Runtime.evaluate", {expression, returnByValue: true, awaitPromise: true})).result.value;
    const navigate = async (url) => {
      await send("Page.navigate", {url});
      await waitUntil(async () => await evaluate("document.readyState === 'complete'"));
    };
    const shot = async (name, clip) => {
      const result = await send("Page.captureScreenshot", {format: "png", captureBeyondViewport: false, clip: {...clip, scale: 1}});
      await writeFile(path.join(out, name), Buffer.from(result.data, "base64"));
      console.log(`Captured ${name}`);
    };

    await navigate("http://localhost:3000/work/CASE-008");
    await waitUntil(async () => await evaluate("document.body.innerText.includes('CASE-008 · 설치 누락인데 도면 개정')"));
    await shot("case008-overview.png", {x: 287, y: 150, width: 1282, height: 310});
    await shot("case008-pattern.png", {x: 287, y: 482, width: 540, height: 560});
    await evaluate("Array.from(document.querySelectorAll('button')).find(button => button.innerText.includes('AI 질문 생성'))?.click()");
    await waitUntil(async () => await evaluate("Boolean(document.querySelector('#case-answer'))"), 30000);
    await shot("case008-question.png", {x: 851, y: 482, width: 718, height: 490});

    await evaluate("document.querySelector('#case-answer').focus()");
    await send("Input.insertText", {text: "실제 설치 위치에 다른 장비가 있어서 그대로 설치할 수 없었습니다."});
    await waitUntil(async () => await evaluate("Boolean(Array.from(document.querySelectorAll('button')).find(button => button.innerText.includes('답변 정리') && !button.disabled))"));
    await evaluate("Array.from(document.querySelectorAll('button')).find(button => button.innerText.includes('답변 정리'))?.click()");
    await waitUntil(async () => await evaluate("document.body.innerText.includes('AI가 정리한 내용 확인')"), 30000);
    await shot("case008-structured.png", {x: 851, y: 482, width: 718, height: 900});

    await navigate("http://localhost:3000/work/CASE-004");
    await waitUntil(async () => await evaluate("document.body.innerText.includes('이 건에는 추가 질문이 필요하지 않습니다')"));
    await shot("case004-no-question.png", {x: 851, y: 482, width: 718, height: 350});

    const notebook = JSON.parse(await readFile(path.join(root, "제출파일", "3반_정다운_KnowWow.ipynb"), "utf8"));
    for (const [name, indexes] of [["notebook-main", [7, 8, 10]], ["notebook-compare", [14]]]) {
      const sections = indexes.map((index) => {
        const cell = notebook.cells[index];
        const output = cell.outputs.map((part) => Array.isArray(part.text) ? part.text.join("") : part.text).join("");
        return `<section><div class="cell-label">In [${cell.execution_count}] / Cell ${index}</div><pre>${escapeHtml(output)}</pre></section>`;
      }).join("");
      const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><style>
        body{font:15px/1.55 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif;background:#f6f8fc;color:#17233b;margin:0;padding:26px;width:1120px}
        h1{font-size:20px;margin:0 0 16px;color:#1658bf}section{background:#fff;border:1px solid #d7e0ef;border-radius:12px;margin-bottom:16px;overflow:hidden}
        .cell-label{font-size:12px;font-weight:700;background:#ecf3ff;padding:8px 14px;color:#2563c8}pre{font:15px/1.55 Menlo,"Apple SD Gothic Neo",monospace;white-space:pre-wrap;overflow-wrap:anywhere;margin:0;padding:15px 18px}
      </style><body><h1>3반_정다운_KnowWow.ipynb - 저장된 실제 실행 결과</h1>${sections}</body></html>`;
      const htmlPath = path.join(out, `${name}.html`);
      await writeFile(htmlPath, html);
      await navigate(`file://${htmlPath}`);
      await shot(`${name}.png`, {x: 0, y: 0, width: 1200, height: name === "notebook-main" ? 630 : 550});
    }
  } finally {
    cdp?.socket.close();
    browser.kill("SIGTERM");
  }
}

main().catch((error) => {console.error(error); process.exitCode = 1;});
