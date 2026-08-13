# onlypoems-poets

The wall of poets that runs on [onlypoems.com/poets](https://onlypoems.com/poets) — every poet
ONLY POEMS has published who has a portrait, laid out as an endless drift of cards you can pan
and search, each one turning over to show a poem.

## What's in here

| File | What it is |
| --- | --- |
| `op-poets.js` | The whole wall. One self-contained script, no dependencies, no build step. |
| `wall.json` | The data it draws: one row per poet, with the poem that goes on the back. |
| `left-off.md` | Who isn't on the wall, and why. Rewritten by the rebuild — don't edit it by hand. |
| `build_poets.py` | The rebuild: reads the CMS, picks each poet's poem, rewrites `wall.json`. |

## How the page uses it

The page carries the headline, the standfirst and the full index of poets as real HTML with
real links, so search engines read them without running any JavaScript. The script adds the
wall and the card on top, and corrects the index if the CMS has moved on since the last
publish.

```html
<div id="op-poets-wall"
     data-poets-src="https://cdn.jsdelivr.net/gh/onlypoemsmag/onlypoems-poets@main/wall.json"></div>
<script src="https://cdn.jsdelivr.net/gh/onlypoemsmag/onlypoems-poets@v1/op-poets.js"></script>
```

**The script is pinned to a tag and the data is not, and that difference is the whole design.**
A tag can never be surprised by a change here, which is what makes rolling the wall back a
one-character edit. But the data has to be free to move, because the point of the thing is that
publishing a poet puts them on the wall without anybody touching Webflow. So `op-poets.js`
comes from `@v1` and `wall.json` comes from `@main`.

To ship a change to the script: commit, cut a new tag, and change the number in Webflow. The
old tag keeps working.

## Keeping it current

The CMS is the source of truth and nothing here needs maintaining by hand.

A poet is on the wall when their Poets Catalog record is **published** and has a **portrait**.
That's the whole rule. Add a photo to somebody who hasn't got one and they appear at the next
rebuild; publish a new poet with a photo and the same. Drafts never appear — the rebuild reads
the live half of the CMS, so an unpublished record can't leak onto a public page.

Each poet brings the **shortest poem attributed to them**, so it stands a chance of being read
on the back of a card rather than scrolled through. Poems whose body never made it into the
CMS — a title, or an epigraph left behind when the text was moved — are skipped, measured on
the poem with any blockquote removed. Without that, Nicole Tallman's card would show 95
characters of Sylvia Plath and nothing of hers.

Portraits are served as the AVIF variant Webflow writes alongside every upload. The API hands
back the URL of the original, which is the file nobody is actually served: the whole set is
19MB as AVIF against 85MB as originals. Where Webflow skipped the variant — it does that on
files that were already small — the original stands.

`left-off.md` lists everyone the rebuild left behind, so a missing poet is always explained
rather than silently absent.

## The rebuild

`.github/workflows/rebuild.yml` runs `build_poets.py` every morning at 06:00 UTC and commits
`wall.json` if anything moved, then tells jsDelivr to drop its copy — otherwise a poet
published on Tuesday could wait until Wednesday to appear, having already been rebuilt. Press
**Run workflow** on the Actions tab to do it now.

It needs one secret, `WEBFLOW_TOKEN`, a Webflow site API token with CMS read access. It is the
same token the atlas uses.

Run it by hand if you want to see what would change:

```
WEBFLOW_TOKEN=... python3 build_poets.py --dry-run
```

## Notes on the wall itself

A few of the decisions are not obvious from the code:

- **Plain scrolling belongs to the page.** The wall sits in the middle of one, so the wheel is
  only taken when ctrl is held — which is also what a trackpad pinch sends. Zooming otherwise
  is the +/− buttons, or a pinch.
- **Cards arrive bigger than they land**, then shrink and straighten into place. Growing in
  from smaller reads as materialising; falling in reads as being dealt.
- **The turn is driven frame by frame**, not by a CSS transition, so the sheen can sweep and
  the lens ribbing peak exactly when the card is edge-on. It is click-driven only, so nothing
  can get stuck half-turned, and the poem doesn't become scrollable until the card has landed.
  That last part is not a nicety: while both faces were hit-testable the wheel found the photo
  behind the poem, the poem never scrolled, and the whole wall flashed while the browser went
  hunting for something else to move.
- **Searching switches the tiling off**, so a match appears once instead of repeating across
  the plane, and the view fits itself to what's left.
- **Dealing again changes the order**, not the jitter. Reseeding the jitter alone only
  re-tilted everybody where they already stood.
