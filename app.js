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
    Object.assign(v, { src: entry.file, autoplay: true, muted: true, loop: true, playsInline: true });
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
    media.append(entries.length ? mediaFor(entries[0], token.ch, data) : note("Picture coming soon"));
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
  output.replaceChildren(...tokens.map((t) => card(t, data)));
  empty.hidden = tokens.length > 0;
  renderCredit(data);
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
