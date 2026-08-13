#!/usr/bin/env python3
"""Rebuild wall.json from the ONLY POEMS CMS.

The CMS is the source of truth. A poet appears on the wall when two things are
true of their Poets Catalog record: it is published, and it has a portrait.
Nothing else is required and nothing is invented. Add a photo to somebody who
hasn't got one and the next rebuild puts them on the wall; there is no list
here to keep in step.

Each poet brings one poem — the shortest one attributed to them, so it stands a
chance of being read on the back of a card rather than scrolled through. Poems
under 20 characters are skipped: those are records where the body never made it
into the CMS and only an epigraph or a title is there, and they would otherwise
win every time.

Portraits are served as the AVIF variant Webflow writes alongside every upload.
The API hands back the URL of the original, which is the file nobody is served
— the whole set is 19MB as AVIF and 85MB as originals, so the swap is the
difference between a wall that loads and one that doesn't. Where the variant
is missing (Webflow skips it on files that were already small) the original
stands.

Usage
    WEBFLOW_TOKEN=... python3 build_poets.py
    python3 build_poets.py --dry-run          # report, write nothing
    python3 build_poets.py --no-avif          # skip the variant check

Exit codes
    0  the wall was rebuilt
    1  the CMS could not be read, or every poet fell out — either is a fault
       worth failing loudly for, rather than quietly shipping an empty wall.
"""
import argparse, html as htmllib, json, os, re, sys, time
import urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = HERE if os.path.exists(os.path.join(HERE, "wall.json")) else os.path.dirname(HERE)
WALL = os.path.join(ROOT, "wall.json")
REPORT = os.path.join(ROOT, "left-off.md")

API = "https://api.webflow.com/v2"

POETS_CATALOG = "6835e70a8ae839aaf82d384f"   # /poems/<slug>      — every contributor
POEMS         = "6835ea52d0707b2c2fab050a"   # the poems themselves
INTERVIEWS    = "6838c79f68239c0150e1a2e9"   # /interviews/<slug>

# A poem this short has no body in the CMS — just a title, or an epigraph left
# behind when the text was moved. Without the floor it wins on length alone.
#
# The floor is measured on the poem MINUS any blockquote, because the failure
# this exists to catch looks long enough to pass otherwise: Nicole Tallman's
# "LET THERE BE A LITTLE LIGHT" is 95 characters of Sylvia Plath and nothing
# else, the body never having made it in. Ranking still uses the whole field,
# so the picks that were already right stay exactly as they were.
MIN_CHARS = 20


# ----------------------------------------------------------------- the CMS
def get(path):
    req = urllib.request.Request(
        API + path,
        headers={"Authorization": "Bearer " + os.environ["WEBFLOW_TOKEN"],
                 "accept-version": "2.0.0", "Accept": "application/json"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and attempt < 4:
                time.sleep(2 ** attempt)
                continue
            raise


def collection(cid):
    """Every published item in a collection.

    /items/live is the important half of this. /items returns drafts too, and
    a draft poet on the wall is a poet published early by accident.
    """
    out, offset = [], 0
    while True:
        page = get("/collections/%s/items/live?limit=100&offset=%d" % (cid, offset))
        items = page.get("items", [])
        out.extend(items)
        offset += len(items)
        if not items or offset >= page.get("pagination", {}).get("total", 0):
            return out


# --------------------------------------------------------------- the text
TAG = re.compile(r"<[^>]+>")
WS = re.compile(r"\s+")
QUOTE = re.compile(r"<blockquote\b.*?</blockquote>", re.I | re.S)


def plain(rich):
    """What a rich text field actually says, tags and entities gone."""
    if not rich:
        return ""
    return WS.sub(" ", htmllib.unescape(TAG.sub(" ", rich))).strip()


def body_only(rich):
    """The poem without its epigraph — see MIN_CHARS."""
    return plain(QUOTE.sub(" ", rich or ""))


def avif(url):
    """The variant Webflow serves, if it wrote one."""
    if not url or url.endswith(".avif"):
        return url
    cand = re.sub(r"\.(jpe?g|png|webp|gif)$", ".avif", url, flags=re.I)
    if cand == url:
        return url
    req = urllib.request.Request(cand, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return cand if r.status == 200 else url
    except Exception:
        return url          # 403 means no variant; the original is still correct


# ------------------------------------------------------------------ build
def build(check_avif=True):
    poets = collection(POETS_CATALOG)
    poems = collection(POEMS)
    interviews = {i["id"]: i["fieldData"].get("slug") for i in collection(INTERVIEWS)}

    # the shortest poem each poet has, ignoring the ones with no body
    best = {}
    for p in poems:
        fd = p.get("fieldData", {})
        poet = fd.get("poet")
        body = fd.get("poem-text")
        if not poet or not body:
            continue
        chars = len(plain(body))
        if len(body_only(body)) < MIN_CHARS:
            continue
        slug = fd.get("slug") or ""
        key = (chars, slug)
        if poet not in best or key < best[poet][0]:
            best[poet] = (key, {"poem": fd.get("name") or "", "poemSlug": slug,
                                "html": body, "chars": chars})

    wall, no_photo, no_poem = [], [], []
    for poet in poets:
        fd = poet.get("fieldData", {})
        name = (fd.get("name") or "").strip()
        slug = fd.get("slug")
        if not name or not slug:
            continue
        image = fd.get("image") or {}
        url = image.get("url")
        if not url:
            no_photo.append(name)
            continue
        pick = best.get(poet["id"])
        if not pick:
            no_poem.append(name)
            continue
        row = {"name": name, "slug": slug, "img": url,
               "credit": plain(fd.get("photo-credit")),
               "interview": interviews.get(fd.get("interview-2")) or ""}
        row.update(pick[1])
        row.pop("chars", None)
        alt = (image.get("alt") or "").strip()
        if alt:
            row["alt"] = alt
        wall.append(row)

    if check_avif and wall:
        with ThreadPoolExecutor(max_workers=12) as pool:
            for row, served in zip(wall, pool.map(avif, [r["img"] for r in wall])):
                row["img"] = served

    wall.sort(key=lambda r: r["name"].lower())
    return wall, no_photo, no_poem


def report(wall, no_photo, no_poem):
    """Who isn't on the wall, and why. Rewritten every run — don't edit by hand."""
    out = ["# Left off the wall", "",
           "Rewritten by the rebuild. %d poets are on the wall." % len(wall), ""]
    out += ["## No portrait (%d)" % len(no_photo), "",
            "They appear the moment a photo goes on their record.", ""]
    out += ["- " + n for n in sorted(no_photo, key=str.lower)] or ["- nobody"]
    out += ["", "## Portrait but no poem (%d)" % len(no_poem), "",
            "Nothing in the Poems collection points at them, or every poem",
            "attributed to them is under %d characters — a title or an epigraph" % MIN_CHARS,
            "with the body missing.", ""]
    out += ["- " + n for n in sorted(no_poem, key=str.lower)] or ["- nobody"]
    return "\n".join(out) + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="report, write nothing")
    ap.add_argument("--no-avif", action="store_true", help="skip the variant check")
    args = ap.parse_args()

    if "WEBFLOW_TOKEN" not in os.environ:
        print("WEBFLOW_TOKEN is not set", file=sys.stderr)
        return 1

    try:
        wall, no_photo, no_poem = build(check_avif=not args.no_avif)
    except urllib.error.HTTPError as e:
        print("the CMS answered %s %s" % (e.code, e.reason), file=sys.stderr)
        return 1

    if not wall:
        print("no poet came through with both a portrait and a poem", file=sys.stderr)
        return 1

    print("%d poets on the wall" % len(wall))
    print("%d have no portrait, %d have a portrait but no poem" % (len(no_photo), len(no_poem)))
    served = sum(1 for r in wall if r["img"].endswith(".avif"))
    print("%d portraits served as AVIF, %d as the original upload" % (served, len(wall) - served))

    if args.dry_run:
        print("dry run — nothing written")
        return 0

    with open(WALL, "w", encoding="utf-8") as f:
        json.dump(wall, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    with open(REPORT, "w", encoding="utf-8") as f:
        f.write(report(wall, no_photo, no_poem))
    print("wrote wall.json (%d KB) and left-off.md" % (os.path.getsize(WALL) // 1024))
    return 0


if __name__ == "__main__":
    sys.exit(main())
