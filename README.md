# handskrift

Type a word and see it fingerspelled, letter by letter, in
**Swedish Sign Language (STS)** or **American Sign Language (ASL)**.

*Handskrift* is Swedish for "handwriting", here meaning writing with your hands.

## Features

- **STS and ASL modes.** STS uses the 29-letter Swedish manual alphabet (A–Ö),
  ASL the 26-letter American one. In ASL mode, Å/Ä/Ö show a "no ASL letter" card.
- **Clips and pictures.** STS letters are short video clips; ASL letters are drawings.
- **Shareable links.** The address keeps the mode and word, e.g. `#sts/katt` or `#asl/cat`.

## Adding a new set of hands

The goal is to show hands of many different people. Each letter in
`data/sts.json` / `data/asl.json` holds a *list* of media, one entry per signer,
so a new set is data only, no code changes:

1. Put the files in `media/<language>/<signer-id>/` (e.g. `media/asl/alex/a.jpg`).
2. Add the signer under `"signers"` with `name`, `credit`, `license` and `source`.
3. Add `{ "signer": "<signer-id>", "file": "…", "type": "image" | "video" }`
   to each letter's list.
4. Credit the set in `CREDITS.md`. Only use media you have the right to share.

## Running locally

```sh
python3 -m http.server
```

Then open <http://localhost:8000>.

## License

The code is MIT licensed (see `LICENSE`). Hand images and video clips come from
outside sources and keep their own licenses; see `CREDITS.md`.
