// handskrift — turn a word into a row of fingerspelling cards.
//
// Each language has a data file (data/sts.json, data/asl.json):
// {
//   "name": "STS",
//   "alphabet": "ABC…",            // letters this manual alphabet has
//   "signers": { "<id>": { "name", "credit", "license", "source" } },
//   "letters": { "A": [ { "signer": "<id>", "file": "media/…", "type": "video" | "image" } ] }
// }
// A letter can list several signers; adding a new set of hands is data-only.

const MODES = ["sts", "asl"];
const input = document.getElementById("word");
const output = document.getElementById("output");
const empty = document.getElementById("empty");
const modeButtons = document.querySelectorAll(".mode");

const cache = {};
let mode = "sts";

async function loadData(m) {
  if (!cache[m]) {
    const res = await fetch(`data/${m}.json`);
    if (!res.ok) throw new Error(`Could not load data/${m}.json`);
    cache[m] = await res.json();
  }
  return cache[m];
}

// Split text into display tokens. Swedish uppercasing keeps Å/Ä/Ö intact,
// and NFC joins "a" + combining ring into a single "Å".
function tokenize(text, data) {
  const tokens = [];
  for (const ch of text.normalize("NFC").toLocaleUpperCase("sv")) {
    if (/\s/.test(ch)) {
      if (tokens.length && tokens[tokens.length - 1].kind !== "gap") tokens.push({ kind: "gap" });
    } else if (data.alphabet.includes(ch)) {
      tokens.push({ kind: "letter", ch });
    } else if (/\p{L}/u.test(ch)) {
      tokens.push({ kind: "missing", ch });
    } else {
      tokens.push({ kind: "plain", ch });
    }
  }
  if (tokens.length && tokens[tokens.length - 1].kind === "gap") tokens.pop();
  return tokens;
}

function mediaFor(entry, ch, data) {
  const signer = data.signers[entry.signer] || {};
  const label = `${data.name} fingerspelling for ${ch}`;
  if (entry.type === "video") {
    const v = document.createElement("video");
    Object.assign(v, { src: entry.file, muted: true, playsInline: true, preload: "auto" });
    v.addEventListener("loadedmetadata", () => showStill(v), { once: true });
    v.setAttribute("aria-label", label);
    v.title = signer.name ? `${label} — ${signer.name}` : label;
    return v;
  }
  const img = document.createElement("img");
  Object.assign(img, { src: entry.file, alt: label, loading: "lazy" });
  img.title = signer.name ? `${label} — ${signer.name}` : label;
  return img;
}

function note(text) {
  const span = document.createElement("span");
  span.className = "note";
  span.textContent = text;
  return span;
}

function card(token, data) {
  const li = document.createElement("li");
  li.className = `card ${token.kind}`;
  if (token.kind === "gap") {
    li.setAttribute("aria-label", "space");
    return li;
  }

  const media = document.createElement("div");
  media.className = "media";
  if (token.kind === "letter") {
    const entries = data.letters[token.ch] || [];
    const entry = entries[0];
    if (entry) {
      media.classList.add(entry.type); // photo | drawing | video: decides how it's framed
      media.append(mediaFor(entry, token.ch, data));
      // Stills can't show movement, so letters that move get a short note.
      if (entry.motion) {
        const m = document.createElement("span");
        m.className = "motion";
        m.textContent = entry.motion;
        media.append(m);
      }
    } else {
      media.append(note("Picture coming soon"));
    }
  } else if (token.kind === "missing") {
    media.append(note(`No ${data.name} letter`));
  } else {
    media.textContent = token.ch;
  }

  const letter = document.createElement("div");
  letter.className = "letter";
  letter.textContent = token.kind === "plain" ? "" : token.ch;

  li.append(media, letter);
  return li;
}

// ---- Playing the word in sequence -------------------------------------------
// One letter at a time: a clip plays once, a picture shows for a moment, then
// the next letter. After the last letter, pause and start over.

const playButton = document.getElementById("playpause");
const player = document.getElementById("player");
const LETTER_MS = 900; // how long a picture (or no-hand card) is highlighted
const GAP_MS = 500; // pause for a space between words
const REPEAT_MS = 1500; // pause before the word starts over
const START_DELAY_MS = 400; // wait for typing to settle before playing

let playing = !matchMedia("(prefers-reduced-motion: reduce)").matches;
let runId = 0;
let startTimer;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Idle clips show a frame from the middle, where the handshape is formed
// (the first frame is just the signer's hands at rest).
function showStill(v) {
  if (v.duration) v.currentTime = v.duration * 0.5;
}

function playOnce(v) {
  return new Promise((resolve) => {
    const done = () => {
      v.removeEventListener("ended", done);
      v.removeEventListener("pause", done);
      clearTimeout(fallback);
      resolve();
    };
    // Safety net in case a clip never fires "ended".
    const fallback = setTimeout(done, ((v.duration || 3) + 2) * 1000);
    v.addEventListener("ended", done);
    v.addEventListener("pause", done);
    v.currentTime = 0;
    v.play().catch(done);
  });
}

function stopSequence() {
  runId++;
  clearTimeout(startTimer);
  for (const li of output.children) {
    li.classList.remove("active");
    const v = li.querySelector("video");
    if (v && !v.paused) v.pause();
    if (v) showStill(v);
  }
}

async function playSequence() {
  const id = ++runId;
  const cards = [...output.children];
  while (id === runId && cards.length) {
    for (const li of cards) {
      if (id !== runId) return;
      li.classList.add("active");
      const v = li.querySelector("video");
      if (v) await playOnce(v);
      else await wait(li.classList.contains("gap") ? GAP_MS : LETTER_MS);
      li.classList.remove("active");
      if (v) showStill(v);
    }
    await wait(REPEAT_MS);
  }
}

function restartSequence() {
  stopSequence();
  if (playing && output.children.length) startTimer = setTimeout(playSequence, START_DELAY_MS);
}

function updatePlayButton() {
  playButton.textContent = playing ? "Pause" : "Play";
  playButton.setAttribute("aria-pressed", String(!playing));
  player.hidden = output.children.length === 0;
}

playButton.addEventListener("click", () => {
  playing = !playing;
  updatePlayButton();
  restartSequence();
});

// Attribution for every signer set in this language (required by CC licenses).
function renderCredit(data) {
  const el = document.getElementById("credit");
  el.replaceChildren();
  for (const s of Object.values(data.signers)) {
    if (el.childNodes.length) el.append(" · ");
    const a = document.createElement("a");
    a.href = s.source;
    a.textContent = s.credit;
    el.append(`${data.name} hands: `, a, `, ${s.license}`);
  }
}

async function render() {
  const data = await loadData(mode);
  const tokens = tokenize(input.value, data);
  stopSequence();
  output.replaceChildren(...tokens.map((t) => card(t, data)));
  empty.hidden = tokens.length > 0;
  renderCredit(data);
  updatePlayButton();
  restartSequence();
  saveHash();
}

function setMode(m) {
  mode = MODES.includes(m) ? m : "sts";
  modeButtons.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.mode === mode)));
  document.documentElement.lang = mode === "sts" ? "sv" : "en";
}

// Shareable links: #sts/katt or #asl/cat
function saveHash() {
  const word = input.value.trim();
  const hash = word ? `#${mode}/${encodeURIComponent(word)}` : `#${mode}`;
  if (location.hash !== hash) history.replaceState(null, "", hash);
}

function readHash() {
  const [m, ...rest] = location.hash.slice(1).split("/");
  setMode(m);
  try {
    input.value = decodeURIComponent(rest.join("/"));
  } catch {
    input.value = "";
  }
}

modeButtons.forEach((b) =>
  b.addEventListener("click", () => {
    setMode(b.dataset.mode);
    render();
  })
);
input.addEventListener("input", render);
document.getElementById("controls").addEventListener("submit", (e) => e.preventDefault());
window.addEventListener("hashchange", () => {
  readHash();
  render();
});

readHash();
render().catch((err) => {
  empty.hidden = false;
  empty.textContent = `Something went wrong: ${err.message}`;
});
