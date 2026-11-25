# Credits

The code in this repo is MIT licensed (see `LICENSE`). The hand media below are
**not** covered by the MIT license; each set keeps its own license.

## STS (Swedish Sign Language): `media/sts/lexikon/`

Photos (`.jpg`) and video clips (`.mp4`) of the Swedish manual alphabet (*handalfabetet*) from
[Svenskt teckenspråkslexikon](https://teckensprakslexikon.su.se/kategori/handalfabetet),
by Avdelningen för teckenspråk, Institutionen för lingvistik, Stockholms universitet.

- License: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
  (attribution, non-commercial, share-alike)
- Changes: none; files renamed by letter (`aa` = Å, `ae` = Ä, `oe` = Ö).
  The site currently shows the photos; the clips are kept for a future video mode.
- Each clip's lexicon entry ID is stored as `id` in `data/sts.json`, e.g.
  `https://teckensprakslexikon.su.se/ord/09531` for A.

Because of the share-alike and non-commercial terms, anyone reusing these clips
must credit the lexicon, use them non-commercially, and share any adaptations
under the same license.

## ASL (American Sign Language): `media/asl/wpclipart/`

Line drawings of the American manual alphabet from
[wpclipart.com](https://www.wpclipart.com/), via
[Wikimedia Commons, Category:ASL letters](https://commons.wikimedia.org/wiki/Category:ASL_letters)
(files `Sign language A.svg` … `Sign language Z.svg`).

- License: public domain
- Changes: none; files renamed by letter.
- Each file's Commons page is stored as `source` in `data/asl.json`.
