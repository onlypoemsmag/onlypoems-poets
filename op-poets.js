/*! op-poets — the ONLY POEMS wall of poets
 *  Draws the wall into #op-poets-wall on onlypoems.com/poets.
 *
 *  The page itself carries the headline, the standfirst and the full index of
 *  poets as real HTML with real links, so search engines read the page without
 *  running this. This file only adds the wall and the card.
 *
 *  Data: wall.json, loaded from the same folder as this script unless the
 *  container carries data-poets-src. One row per published poet who has a
 *  portrait, with the shortest poem attributed to them. Rebuilt from the CMS
 *  by build_poets.py — see the README.
 */
(function () {
  "use strict";

  var ROOT_ID = "op-poets-wall";
  var root = document.getElementById(ROOT_ID);
  if (!root) return;

  /* ------------------------------------------------- where is wall.json */
  var here = (document.currentScript && document.currentScript.src) || "";
  var SRC = root.getAttribute("data-poets-src") ||
            (here ? here.replace(/[^/]*$/, "wall.json") : "wall.json");
  var SITE = root.getAttribute("data-site") || "https://onlypoems.com";

  /* ------------------------------------------------------------ styles */
  var CSS = [
    "#op-poets-wall{position:relative;display:block!important;padding:0;border:0!important;",
      "min-height:0!important;overflow:hidden;border-radius:14px;",
      "--opw-blue:#0153db;--opw-pale:#edefff;--opw-wash:#c3cfff;--opw-ink:#05214e;",
      "--opw-pink:#ff84f9;--opw-paper:#fefcff;--opw-blush:#fdf2ff;--opw-blush-deep:#fde7ff;",
      "--opw-display:\"cofo-raffine\",\"Playfair Display\",Georgia,serif;",
      "--opw-read:\"calluna\",\"Source Serif 4\",Georgia,serif;",
      "--opw-ui:\"basic-sans\",\"Archivo\",-apple-system,BlinkMacSystemFont,sans-serif}",

    /* The written-out index stays in the page for search engines and screen
       readers; the wall is the sighted way in. It goes out of the flow the
       moment this file parses, not when the data lands — waiting meant the
       page shrank by the height of 174 names while you were reading it.
       If the wall fails to load, .opw-show puts it back. */
    ".op-poets-index:not(.opw-show){position:absolute!important;width:1px!important;",
      "height:1px!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;",
      "white-space:nowrap!important;margin:-1px!important;padding:0!important;border:0!important}",

    ".opw-stage{position:relative;width:100%;overflow:hidden;cursor:grab;touch-action:none;",
      "background:var(--opw-blush);",
      "background-image:radial-gradient(120% 90% at 50% -10%,#fffdff 0%,rgba(255,253,255,0) 60%)}",
    ".opw-stage.opw-grab{cursor:grabbing}",
    ".opw-layer{position:absolute;top:0;left:0;transform-origin:0 0;will-change:transform;",
      "backface-visibility:hidden}",

    ".opw-tile{position:absolute;top:0;left:0;transform-origin:50% 50%;background:var(--opw-paper);",
      "border-radius:11px;padding:9px 9px 0;box-shadow:0 10px 24px -14px rgba(74,12,70,.44);",
      "border:1px solid rgba(74,12,70,.06);contain:layout style paint}",
    ".opw-tile::after{content:\"\";position:absolute;inset:-1px;border-radius:11px;",
      "border:1px solid transparent;transition:border-color .2s ease;pointer-events:none}",
    ".opw-tile:hover::after{border-color:var(--opw-pink)}",
    ".opw-ph{position:relative;width:100%;border-radius:6px;overflow:hidden;background:#f6e9fa}",
    ".opw-tile img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;",
      "opacity:0;transition:opacity .4s ease}",
    ".opw-tile img.opw-on{opacity:1}",
    ".opw-cap{font-family:var(--opw-read);font-size:12.5px;line-height:1;color:#000;",
      "padding:9px 2px 10px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    /* while the camera is moving, drop the hover ring work */
    ".opw-moving .opw-tile::after{transition:none}",
    /* far out the captions are unreadable anyway — skip the text layout */
    ".opw-tiny .opw-cap{visibility:hidden}",
    ".opw-tiny .opw-tile{box-shadow:0 5px 12px -8px rgba(74,12,70,.35)}",
    ".opw-blur{filter:blur(10px) saturate(1.06);transition:filter .28s ease}",

    ".opw-bar{position:absolute;top:16px;left:50%;transform:translateX(-50%);z-index:6;",
      "display:flex;align-items:center;gap:2px;background:var(--opw-paper);border-radius:14px;",
      "border:1px solid rgba(74,12,70,.08);box-shadow:0 14px 34px -18px rgba(74,12,70,.45);",
      "padding:6px;max-width:min(92%,460px);transition:opacity .28s ease}",
    ".opw-bar input{border:0;outline:0;background:transparent;font-family:var(--opw-ui);",
      "font-size:14px;color:var(--opw-ink);padding:6px 10px;width:min(56vw,318px);margin:0}",
    ".opw-bar input::placeholder{color:#b39ab3}",
    ".opw-glass{flex:0 0 auto;display:grid;place-items:center;width:30px;height:30px;",
      "color:#cbb0cd;transition:color .2s ease;pointer-events:none}",
    ".opw-glass svg{width:15px;height:15px}",
    ".opw-bar.opw-typing .opw-glass{color:var(--opw-blue)}",
    ".opw-icon{width:30px;height:30px;flex:0 0 30px;border-radius:9px;border:0;padding:0;",
      "background:var(--opw-blush-deep);color:var(--opw-blue);display:grid;place-items:center;",
      "cursor:pointer;transition:background .18s ease}",
    ".opw-icon:hover{background:#fbd4fb}",
    ".opw-icon svg{width:15px;height:15px}",

    ".opw-hint{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);z-index:6;",
      "font-family:var(--opw-ui);font-size:12px;color:#a98cab;background:rgba(254,252,255,.85);",
      "padding:7px 15px;border-radius:999px;border:1px solid rgba(74,12,70,.06);",
      "pointer-events:none;white-space:nowrap;transition:opacity .5s ease}",
    ".opw-zoom{position:absolute;bottom:18px;right:18px;z-index:6;display:flex;",
      "flex-direction:column;gap:6px;transition:opacity .28s ease}",
    ".opw-zoom button{width:34px;height:34px;border-radius:10px;border:1px solid rgba(74,12,70,.08);",
      "background:var(--opw-paper);color:var(--opw-blue);font-size:16px;font-family:var(--opw-ui);",
      "cursor:pointer;line-height:1;padding:0}",
    ".opw-zoom button:hover{background:var(--opw-blush-deep)}",
    ".opw-empty{position:absolute;inset:0;display:none;place-items:center;z-index:4;pointer-events:none}",
    ".opw-empty p{font-family:var(--opw-read);font-size:18px;color:#a98cab;margin:0}",
    ".opw-off{opacity:0;pointer-events:none}",

    /* ---------------------------------------------------------- the card */
    ".opw-reader{position:fixed;inset:0;z-index:9999;display:none;place-items:center;",
      "background:rgba(253,242,255,.74);--opw-sx:.5;--opw-sy:.5;--opw-lit:0}",
    ".opw-reader.opw-open{display:grid}",
    ".opw-flipwrap{perspective:1600px;perspective-origin:50% 42%;width:min(91vw,452px);",
      "height:min(89vh,712px);transform-origin:50% 50%}",
    ".opw-cardtilt{position:relative;width:100%;height:100%;transform-style:preserve-3d;",
      "transition:transform .5s cubic-bezier(.2,.8,.2,1)}",
    ".opw-flipper{position:relative;width:100%;height:100%;transform-style:preserve-3d;",
      "will-change:transform}",
    /* The surface: almost no highlight. The silver comes from the shade layer,
       which is the part that reads as an object you could pick up. */
    ".opw-lay{position:absolute;inset:0;pointer-events:none;border-radius:inherit;z-index:6;",
      "transition:opacity .32s ease}",
    ".opw-hot{mix-blend-mode:overlay;opacity:calc(var(--opw-lit) * .01);",
      "background:radial-gradient(farthest-corner circle at calc(var(--opw-sx)*100%) calc(var(--opw-sy)*100%),",
      "rgba(255,251,254,.8) 2.2%,rgba(255,251,254,.5) 4.6%,rgba(255,251,254,0) 55%)}",
    ".opw-vig{mix-blend-mode:overlay;z-index:5;opacity:calc(var(--opw-lit) * .20);",
      "background:radial-gradient(farthest-corner circle at calc(var(--opw-sx)*100%) calc(var(--opw-sy)*100%),",
      "hsla(0,0%,0%,0) 50%,hsla(0,0%,0%,1) 100%)}",
    /* The lenticular pair: a sheen that sweeps as the card turns, and the lens
       ribbing that peaks exactly when the card is edge-on. Photo face only. */
    ".opw-gloss{position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;",
      "background:linear-gradient(102deg,transparent 34%,rgba(255,255,255,.34) 50%,transparent 66%);",
      "background-size:280% 100%}",
    ".opw-ridge{position:absolute;inset:0;pointer-events:none;opacity:0;",
      "background:repeating-linear-gradient(90deg,rgba(0,0,0,.45) 0 1px,transparent 1px 5px)}",
    ".opw-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;",
      "background:var(--opw-paper);border-radius:14px;overflow:hidden;",
      "border:1px solid rgba(74,12,70,.07);box-shadow:0 40px 80px -34px rgba(74,12,70,.5)}",

    ".opw-front{display:flex;flex-direction:column;cursor:pointer}",
    ".opw-pic{flex:1 1 auto;min-height:0;background:#f6e9fa;position:relative;",
      "margin:10px 10px 0;border-radius:12px;overflow:hidden}",
    ".opw-pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}",
    ".opw-ffoot{flex:0 0 auto;padding:15px 20px 18px;text-align:center}",
    ".opw-nm{font-family:var(--opw-read);font-size:19px;color:#000;line-height:1.2}",
    ".opw-cr{font-family:var(--opw-ui);font-size:10.5px;letter-spacing:.06em;",
      "text-transform:uppercase;color:#b39ab3;margin-top:6px}",
    ".opw-go{font-family:var(--opw-ui);font-size:11px;letter-spacing:.1em;text-transform:uppercase;",
      "color:var(--opw-blue);margin-top:11px}",

    /* Both faces stay in the DOM, so both stay hit-testable unless told not to
       be. That is what made the wall flash: the wheel found the photo behind
       the poem, the poem never scrolled, and the browser went hunting for
       something else to move. */
    ".opw-back{transform:rotateY(180deg);display:flex;flex-direction:column;cursor:default;",
      "pointer-events:none}",
    ".opw-flipper.opw-landed .opw-back{pointer-events:auto}",
    ".opw-flipper.opw-landed .opw-front{pointer-events:none}",
    ".opw-bhead{flex:0 0 auto;padding:42px 28px 14px}",
    ".opw-who{font-family:var(--opw-read);font-size:14.5px;color:#000;line-height:1}",
    ".opw-bhead h2{margin:9px 0 0;font-family:var(--opw-display);font-weight:400;font-size:31px;",
      "line-height:1.06;color:var(--opw-blue)}",
    ".opw-bwrap{flex:1 1 auto;min-height:0;position:relative;display:flex}",
    ".opw-bwrap::after{content:\"\";position:absolute;left:0;right:7px;bottom:0;height:34px;",
      "pointer-events:none;background:linear-gradient(to bottom,rgba(254,252,255,0),var(--opw-paper));",
      "opacity:0;transition:opacity .25s ease}",
    ".opw-bwrap.opw-more::after{opacity:1}",
    ".opw-flipper.opw-landed .opw-body{overflow-y:auto}",
    ".opw-body{flex:1 1 auto;min-height:0;overflow:hidden;overscroll-behavior:contain;",
      "padding:14px 28px 22px;font-family:var(--opw-read);font-size:15px;line-height:1.52;",
      "color:#000;-webkit-overflow-scrolling:touch;scrollbar-width:none}",
    ".opw-body::-webkit-scrollbar{width:0;height:0;display:none}",
    /* macOS hides the real scrollbar until you are already scrolling, which is
       the one moment the hint is useless. So the poem carries its own. */
    ".opw-sbar{position:absolute;top:10px;bottom:10px;right:7px;width:4px;border-radius:99px;",
      "background:rgba(74,12,70,.05);opacity:0;transition:opacity .22s ease;pointer-events:none}",
    ".opw-sbar.opw-show{opacity:1}",
    ".opw-sthumb{position:absolute;left:0;width:100%;min-height:24px;border-radius:99px;background:#dcb0e2}",
    ".opw-body p{margin:0 0 1.05em}",
    ".opw-body ul{margin:0 0 1.05em;padding:0;list-style:none}",
    ".opw-body li{margin:0}",
    ".opw-body.opw-perline p,.opw-body.opw-perline li{margin:0}",
    ".opw-body.opw-perline ul{margin:0}",
    ".opw-body.opw-perline p.opw-brk,.opw-body.opw-perline li.opw-brk{height:1.05em}",
    ".opw-body blockquote{margin:0 0 1.35em;padding:0 0 0 1.7em;border:0;font-style:italic;",
      "font-size:13px;line-height:1.5}",
    ".opw-body a{color:var(--opw-blue);text-decoration:none;border-bottom:1px solid var(--opw-wash)}",
    ".opw-bfoot{flex:0 0 auto;padding:13px 28px 17px;border-top:1px solid rgba(74,12,70,.08);",
      "display:flex;align-items:center;justify-content:space-between;gap:12px}",
    ".opw-bfoot.opw-solo{justify-content:center}",
    ".opw-bfoot.opw-solo .opw-view{display:none}",
    ".opw-bfoot a{font-family:var(--opw-ui);font-size:11.5px;letter-spacing:.07em;",
      "text-transform:uppercase;color:var(--opw-blue);text-decoration:none;padding:8px 13px;",
      "border-radius:9px;background:var(--opw-pale);transition:background .18s ease;white-space:nowrap}",
    ".opw-bfoot a:hover{background:var(--opw-wash)}",

    ".opw-nav{position:fixed;top:50%;transform:translateY(-50%);z-index:10000;width:46px;height:46px;",
      "border-radius:999px;border:1px solid rgba(74,12,70,.08);background:var(--opw-paper);",
      "color:var(--opw-blue);cursor:pointer;display:grid;place-items:center;font-size:17px;",
      "font-family:var(--opw-ui);box-shadow:0 4px 14px -6px rgba(74,12,70,.4);padding:0;",
      "transition:background .22s ease,transform .26s cubic-bezier(.2,.85,.25,1),box-shadow .22s ease}",
    ".opw-nav span{display:block;line-height:1;transition:transform .26s cubic-bezier(.2,.85,.25,1)}",
    ".opw-nav:hover{background:var(--opw-blush-deep);transform:translateY(-50%) scale(1.07);",
      "box-shadow:0 8px 22px -8px rgba(74,12,70,.42)}",
    ".opw-nav:hover span{transform:scale(1.42)}",
    ".opw-nav:active{transform:translateY(-50%) scale(1.02)}",
    ".opw-prev{left:max(18px,calc(50vw - min(91vw,452px)/2 - 68px))}",
    ".opw-next{right:max(18px,calc(50vw - min(91vw,452px)/2 - 68px))}",
    ".opw-x{position:fixed;top:22px;right:22px;z-index:10000;width:38px;height:38px;padding:0;",
      "border-radius:999px;border:1px solid rgba(74,12,70,.08);background:var(--opw-paper);",
      "color:var(--opw-ink);cursor:pointer;font-size:16px;display:grid;place-items:center;",
      "box-shadow:0 4px 14px -6px rgba(74,12,70,.4)}",
    ".opw-x:hover{color:var(--opw-blue);background:var(--opw-blush-deep)}",
    "@media (max-width:640px){.opw-nav{display:none}.opw-bar input{width:100%;flex:1 1 auto}",
      ".opw-bhead h2{font-size:26px}}",
    "@media (prefers-reduced-motion:reduce){.opw-tile,.opw-cardtilt{transition:none!important}}"
  ].join("");

  var st = document.createElement("style");
  st.textContent = CSS;
  document.head.appendChild(st);

  /* ------------------------------------------------------------ markup */
  root.innerHTML =
    '<div class="opw-stage"><div class="opw-layer"></div>' +
      '<div class="opw-bar">' +
        '<button class="opw-icon opw-shuffle" type="button" title="Deal the wall again" aria-label="Deal the wall again">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>' +
        '</button>' +
        '<input class="opw-q" type="search" placeholder="Are you looking for someone?" autocomplete="off" spellcheck="false" aria-label="Search the poets">' +
        '<span class="opw-glass" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>' +
        '</span>' +
      '</div>' +
      '<div class="opw-empty"><p>No poets by that name here, alas :(</p></div>' +
      '<div class="opw-hint"></div>' +
      '<div class="opw-zoom"><button type="button" class="opw-zin" aria-label="Zoom in">+</button>' +
        '<button type="button" class="opw-zout" aria-label="Zoom out">−</button></div>' +
    '</div>';

  var stage = root.querySelector(".opw-stage"),
      layer = root.querySelector(".opw-layer"),
      bar   = root.querySelector(".opw-bar"),
      qEl   = root.querySelector(".opw-q"),
      emptyEl = root.querySelector(".opw-empty"),
      hintEl  = root.querySelector(".opw-hint"),
      zoomEl  = root.querySelector(".opw-zoom");

  var coarse = window.matchMedia && window.matchMedia("(pointer:coarse)").matches;
  hintEl.textContent = coarse
    ? "drag to pan · pinch to zoom · tap a poet to read"
    : "drag to pan · pinch or ctrl-scroll to zoom · click a poet to read";

  /* The reader is appended to the body, not the container: a fixed element
     inside a transformed ancestor stops being fixed, and Webflow puts
     transforms on more things than you would expect. */
  var reader = document.createElement("div");
  reader.className = "opw-reader";
  reader.setAttribute("role", "dialog");
  reader.setAttribute("aria-modal", "true");
  reader.innerHTML =
    '<button class="opw-nav opw-prev" type="button" aria-label="Previous poet"><span>‹</span></button>' +
    '<div class="opw-flipwrap"><div class="opw-cardtilt"><div class="opw-flipper">' +
      '<div class="opw-face opw-front">' +
        '<div class="opw-pic"><img class="opw-fimg" alt=""></div>' +
        '<div class="opw-ffoot"><div class="opw-nm"></div><div class="opw-cr"></div>' +
          '<div class="opw-go">tap to read their poem</div></div>' +
        '<div class="opw-lay opw-vig"></div><div class="opw-lay opw-hot"></div>' +
        '<div class="opw-gloss"></div><div class="opw-ridge"></div>' +
      '</div>' +
      '<div class="opw-face opw-back">' +
        '<div class="opw-bhead"><div class="opw-who"></div><h2></h2></div>' +
        '<div class="opw-bwrap"><div class="opw-body"></div>' +
          '<div class="opw-sbar"><div class="opw-sthumb"></div></div></div>' +
        '<div class="opw-bfoot"><a class="opw-main" href="#">Read all their poems</a>' +
          '<a class="opw-view" href="#">Read their interview</a></div>' +
      '</div>' +
    '</div></div></div>' +
    '<button class="opw-nav opw-next" type="button" aria-label="Next poet"><span>›</span></button>' +
    '<button class="opw-x" type="button" aria-label="Close">✕</button>';
  document.body.appendChild(reader);

  var flipwrap = reader.querySelector(".opw-flipwrap"),
      cardtilt = reader.querySelector(".opw-cardtilt"),
      flipper  = reader.querySelector(".opw-flipper"),
      frontEl  = reader.querySelector(".opw-front"),
      backEl   = reader.querySelector(".opw-back"),
      fimg     = reader.querySelector(".opw-fimg"),
      glossEl  = reader.querySelector(".opw-gloss"),
      ridgeEl  = reader.querySelector(".opw-ridge"),
      bodyEl   = reader.querySelector(".opw-body"),
      bwrap    = reader.querySelector(".opw-bwrap"),
      sbar     = reader.querySelector(".opw-sbar"),
      sthumb   = reader.querySelector(".opw-sthumb"),
      bfoot    = reader.querySelector(".opw-bfoot"),
      mainLink = reader.querySelector(".opw-main"),
      viewLink = reader.querySelector(".opw-view");

  /* ------------------------------------------------------------ sizing */
  var CARD_W = 218, CARD_H = 292, CELL_W = 306, CELL_H = 382;
  var MIN_S = 0.32, MAX_S = 2.4;
  var vw = 0, vh = 0;

  function resize() {
    var box = stage.getBoundingClientRect();
    vw = Math.round(box.width) || 1;
    var ih = window.innerHeight || 800;
    vh = Math.round(Math.max(440, Math.min(vw * 0.62, 760)));
    /* Keep page either side of it. A wall that fills the screen on a phone is
       a wall you cannot scroll past. */
    if (vw < 720) vh = Math.round(Math.min(vh, ih * 0.68));
    stage.style.height = vh + "px";
    lastKey = "";
    applyCam();
  }

  /* ------------------------------------------------------------ layout */
  var BW = 0, BH = 0, placed = [], wrapOn = true, seedSalt = 0;
  var box = { cx: 0, cy: 0, w: 1, h: 1 };

  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) / 4294967296;
  }

  function layout(list) {
    var n = list.length;
    var cols = Math.max(1, Math.round(Math.sqrt(n * 1.45)));
    var rows = Math.ceil(n / cols);
    BW = cols * CELL_W; BH = rows * CELL_H;
    placed = list.map(function (d, i) {
      var c = i % cols, r = (i / cols) | 0;
      var j1 = hash(d.slug + ":x" + seedSalt),
          j2 = hash(d.slug + ":y" + seedSalt),
          j3 = hash(d.slug + ":r" + seedSalt);
      return { d: d, i: i,
        x: c * CELL_W + (CELL_W - CARD_W) / 2 + (j1 - .5) * 62,
        y: r * CELL_H + (CELL_H - CARD_H) / 2 + (j2 - .5) * 74,
        rot: (j3 - .5) * 5.4 };
    });
    /* The true bounding box of what was placed. The last row is usually short,
       so centring on BW/2,BH/2 sits the group off to one side. */
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (var k = 0; k < placed.length; k++) {
      var p = placed[k];
      if (p.x < x0) x0 = p.x;
      if (p.y < y0) y0 = p.y;
      if (p.x + CARD_W > x1) x1 = p.x + CARD_W;
      if (p.y + CARD_H > y1) y1 = p.y + CARD_H;
    }
    box = placed.length ? { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 }
                        : { cx: 0, cy: 0, w: 1, h: 1 };
  }

  /* ------------------------------------------------------------ camera
     cam is what's on screen, tgt is where it's heading. One rAF loop eases cam
     toward tgt, so a zoom and a fling both arrive smoothly instead of snapping
     per event. Tile transforms are written once, on creation — they live in
     world space inside the layer, so panning only touches one node. */
  var cam = { x: 0, y: 0, s: 0.66 }, tgt = { x: 0, y: 0, s: 0.66 };
  var anchor = null, looping = false, movingNow = false, stopTimer = 0, dirty = false;

  function kick() { if (!looping) { looping = true; requestAnimationFrame(tick); } }

  function markMoving() {
    if (!movingNow) { movingNow = true; root.classList.add("opw-moving"); }
    clearTimeout(stopTimer);
    stopTimer = setTimeout(function () {
      movingNow = false; root.classList.remove("opw-moving");
    }, 140);
  }

  function applyCam() {
    layer.style.transform = "translate3d(" + (-cam.x * cam.s + vw / 2).toFixed(2) + "px," +
      (-cam.y * cam.s + vh / 2).toFixed(2) + "px,0) scale(" + cam.s.toFixed(4) + ")";
  }

  function tick() {
    if (fling) {
      vel.x *= 0.935; vel.y *= 0.935;
      tgt.x -= vel.x; tgt.y -= vel.y;
      cam.x = tgt.x; cam.y = tgt.y;
      if (Math.abs(vel.x) + Math.abs(vel.y) < 0.08) fling = false;
      markMoving();
    }
    var ds = tgt.s - cam.s, dx = tgt.x - cam.x, dy = tgt.y - cam.y;
    if (Math.abs(ds) > 1e-4 || Math.abs(dx) > 0.04 || Math.abs(dy) > 0.04) {
      cam.s += ds * 0.20; cam.x += dx * 0.24; cam.y += dy * 0.24;
      if (anchor) {   // hold the zoom focus under the pointer while it eases
        cam.x = anchor.wx - (anchor.sx - vw / 2) / cam.s;
        cam.y = anchor.wy - (anchor.sy - vh / 2) / cam.s;
        tgt.x = cam.x; tgt.y = cam.y;
      }
      markMoving();
    } else {
      cam.s = tgt.s; cam.x = tgt.x; cam.y = tgt.y; anchor = null;
    }
    applyCam();
    populate();
    var wasDirty = dirty; dirty = false;
    if (wasDirty || dragging || fling || anchor || Math.abs(tgt.s - cam.s) > 1e-4 ||
        Math.abs(tgt.x - cam.x) > 0.04 || Math.abs(tgt.y - cam.y) > 0.04) {
      requestAnimationFrame(tick);
    } else looping = false;
  }

  /* ------------------------------------------------------------- tiles */
  var reading = false;
  var pool = {}, poolKeys = [], recycled = [], loaded = {};
  var lastKey = "", queue = [], queued = false, inFlight = 0;

  function populate() {
    if (reading) return;                 // the wall is frozen while a card is open
    var m = 300;
    var x0 = cam.x - vw / (2 * cam.s) - m, x1 = cam.x + vw / (2 * cam.s) + m;
    var y0 = cam.y - vh / (2 * cam.s) - m, y1 = cam.y + vh / (2 * cam.s) + m;
    var bx0 = 0, bx1 = 0, by0 = 0, by1 = 0;
    if (wrapOn) {
      bx0 = Math.floor(x0 / BW); bx1 = Math.floor(x1 / BW);
      by0 = Math.floor(y0 / BH); by1 = Math.floor(y1 / BH);
    }
    var key = [bx0, bx1, by0, by1, (x0 / 40) | 0, (x1 / 40) | 0, (y0 / 40) | 0, (y1 / 40) | 0].join(",");
    if (key === lastKey && !queue.length) return;
    lastKey = key;

    root.classList.toggle("opw-tiny", cam.s < 0.42);

    var live = {}, want = [], bx, by, i;
    for (bx = bx0; bx <= bx1; bx++) for (by = by0; by <= by1; by++) {
      var ox = bx * BW, oy = by * BH;
      for (i = 0; i < placed.length; i++) {
        var p = placed[i], X = p.x + ox, Y = p.y + oy;
        if (X > x1 || X + CARD_W < x0 || Y > y1 || Y + CARD_H < y0) continue;
        var k = i + "|" + bx + "|" + by;
        live[k] = 1;
        if (!pool[k]) want.push({ k: k, p: p, X: X, Y: Y,
          d: Math.hypot(X + CARD_W / 2 - cam.x, Y + CARD_H / 2 - cam.y) });
      }
    }
    for (i = poolKeys.length - 1; i >= 0; i--) {
      var pk = poolKeys[i];
      if (!live[pk]) { release(pk, pool[pk]); poolKeys.splice(i, 1); }
    }

    want.sort(function (u, v) { return u.d - v.d; });   // nearest the middle first
    var n = Math.min(movingNow ? 6 : 14, want.length);
    for (i = 0; i < n; i++) make(want[i].k, want[i].p, want[i].X, want[i].Y);
    queue = want.slice(n);
    if (queue.length && !queued) {                      // fill in over later frames
      queued = true;
      requestAnimationFrame(function () { queued = false; lastKey = ""; populate(); });
    }
  }

  function release(k, el) {
    if (el.getAnimations) el.getAnimations().forEach(function (a) { a.cancel(); });
    el.style.willChange = "";
    if (el.parentNode) el.parentNode.removeChild(el);
    delete pool[k];
    if (recycled.length < 80) recycled.push(el);
  }

  // the CMS alt wins where there is one; otherwise say what the picture is
  function altFor(d) { return d.alt || (d.name + ", poet"); }

  function make(k, p, X, Y) {
    var el = recycled.pop(), im;
    if (el) {
      im = el._img;
      el._cap.textContent = p.d.name;
      if (im.getAttribute("src") !== p.d.img) { im.classList.remove("opw-on"); im.src = p.d.img; }
      im.alt = altFor(p.d);
    } else {
      el = document.createElement("div");
      el.className = "opw-tile";
      el.style.width = CARD_W + "px";
      var ph = document.createElement("div");
      ph.className = "opw-ph";
      ph.style.height = Math.round(CARD_W * 1.16) + "px";
      im = document.createElement("img");
      im.decoding = "async"; im.loading = "lazy"; im.draggable = false;
      im.alt = altFor(p.d); im.src = p.d.img;
      im.addEventListener("load", function () {
        loaded[im.getAttribute("src")] = 1; im.classList.add("opw-on");
      });
      ph.appendChild(im);
      var cap = document.createElement("div");
      cap.className = "opw-cap";
      cap.textContent = p.d.name;
      el.appendChild(ph); el.appendChild(cap);
      el._img = im; el._cap = cap;
    }
    if (loaded[p.d.img]) im.classList.add("opw-on");
    var base = "translate(" + X + "px," + Y + "px) rotate(" + p.rot + "deg)";
    el.style.transform = base;
    el.setAttribute("data-i", p.i);
    layer.appendChild(el);
    pool[k] = el; poolKeys.push(k);
    settle(el, base, p, X, Y);
  }

  /* -------------------------------------------------- cards arriving
     Incoming cards are BIGGER than the settled ones and more steeply rotated,
     then shrink and straighten into the grid — they fall onto the wall from
     nearer the viewer. An earlier version had them growing in from smaller,
     which is why it read wrong: growing in says materialising, falling in says
     being dealt. */
  var AR = { scale: 150, rot: 450, dur: 900, stagger: 20, on: 1 };

  function settle(el, base, p, X, Y) {
    if (!AR.on || !el.animate) return;
    if (inFlight > 34) return;   // past this it is a blur anyway, and the layer
                                 // churn is what makes it stutter
    var d = Math.hypot(X + CARD_W / 2 - cam.x, Y + CARD_H / 2 - cam.y) * cam.s;
    var delay = Math.min(190, d / (AR.stagger || 9));
    var from = "translate(" + X + "px," + Y + "px) rotate(" +
      (p.rot * AR.rot / 100).toFixed(2) + "deg) scale(" + AR.scale / 100 + ")";
    inFlight++;
    el.style.willChange = "transform, opacity";   // a compositor layer, but only while it moves
    var anim = el.animate(
      [{ transform: from, opacity: 0, offset: 0 },
       { opacity: 1, offset: .22 },
       { transform: base, opacity: 1, offset: 1 }],
      { duration: AR.dur, delay: delay, easing: "cubic-bezier(.16,.84,.24,1)", fill: "backwards" });
    var done = function () { inFlight = Math.max(0, inFlight - 1); el.style.willChange = ""; };
    if (anim.finished) anim.finished.then(done, done); else anim.onfinish = done;
  }

  function rebuild() {
    inFlight = 0;
    for (var i = 0; i < poolKeys.length; i++) release(poolKeys[i], pool[poolKeys[i]]);
    poolKeys = []; queue = []; lastKey = "";
    populate();
  }

  /* -------------------------------------------------- pan / zoom / tap
     Pointer capture would retarget the click to the stage and swallow taps on
     a tile, so the tap is hit-tested by hand on pointerup instead. */
  var dragging = false, moved = 0, last = null, vel = { x: 0, y: 0 }, fling = false, downAt = null;

  stage.addEventListener("pointerdown", function (e) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    dragging = true; moved = 0; fling = false; anchor = null;
    last = { x: e.clientX, y: e.clientY };
    downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    vel = { x: 0, y: 0 };
    stage.classList.add("opw-grab");
    kick();
  });

  stage.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var dx = (e.clientX - last.x) / cam.s, dy = (e.clientY - last.y) / cam.s;
    moved += Math.abs(e.clientX - last.x) + Math.abs(e.clientY - last.y);
    cam.x -= dx; cam.y -= dy; tgt.x = cam.x; tgt.y = cam.y;
    vel = { x: dx, y: dy };
    last = { x: e.clientX, y: e.clientY };
    hideHint(); markMoving();
    dirty = true;            // coalesce into the next frame instead of doing it now
    kick();
  });

  function up(e) {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove("opw-grab");
    var quick = downAt && performance.now() - downAt.t < 550;
    if (moved < 7 && quick) tapAt(e.clientX, e.clientY);
    else if (Math.abs(vel.x) + Math.abs(vel.y) > 0.6) { fling = true; kick(); }
  }
  stage.addEventListener("pointerup", up);
  stage.addEventListener("pointercancel", function () {
    dragging = false; stage.classList.remove("opw-grab");
  });
  stage.addEventListener("pointerleave", function (e) { if (dragging) up(e); });

  function tapAt(x, y) {
    var el = document.elementFromPoint(x, y);
    var tile = el && el.closest ? el.closest(".opw-tile") : null;
    if (tile) open(+tile.getAttribute("data-i"), tile);
  }

  /* Plain scrolling belongs to the page — this sits in the middle of one, and
     a wall that eats the wheel is a wall you cannot scroll past. ctrl+wheel is
     also what a trackpad pinch sends, so the gesture people reach for works. */
  stage.addEventListener("wheel", function (e) {
    if (!e.ctrlKey) return;
    e.preventDefault();
    hideHint(); fling = false;
    var f = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.028 : 0.0022));
    tgt.s = Math.min(MAX_S, Math.max(MIN_S, tgt.s * f));
    var r = stage.getBoundingClientRect();
    anchor = { sx: e.clientX - r.left, sy: e.clientY - r.top,
               wx: cam.x + (e.clientX - r.left - vw / 2) / cam.s,
               wy: cam.y + (e.clientY - r.top - vh / 2) / cam.s };
    kick();
  }, { passive: false });

  var pinch = null;
  function pdist(e) {
    var a = e.touches[0], b = e.touches[1];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }
  stage.addEventListener("touchstart", function (e) {
    if (e.touches.length === 2) pinch = pdist(e);
  }, { passive: true });
  stage.addEventListener("touchmove", function (e) {
    if (e.touches.length === 2 && pinch) {
      e.preventDefault();
      var d = pdist(e);
      tgt.s = Math.min(MAX_S, Math.max(MIN_S, tgt.s * (d / pinch)));
      cam.s = tgt.s; pinch = d;
      applyCam(); populate(); markMoving();
    }
  }, { passive: false });
  stage.addEventListener("touchend", function () { pinch = null; });

  function zoomBy(f) {
    fling = false;
    tgt.s = Math.min(MAX_S, Math.max(MIN_S, tgt.s * f));
    anchor = { sx: vw / 2, sy: vh / 2, wx: cam.x, wy: cam.y };
    kick();
  }
  root.querySelector(".opw-zin").onclick = function () { zoomBy(1.3); };
  root.querySelector(".opw-zout").onclick = function () { zoomBy(1 / 1.3); };

  var hintGone = false;
  function hideHint() { if (hintGone) return; hintGone = true; hintEl.style.opacity = 0; }

  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { resize(); populate(); }, 140);
  });

  /* ------------------------------------------------------------ filter
     Searching switches the wrapping off, so a match appears exactly once
     instead of repeating across the tiled plane. The view then fits to size. */
  var DATA = [], view = [];

  function apply(q) {
    q = (q || "").trim().toLowerCase();
    view = q ? DATA.filter(function (d) {
      return (d.name + " " + d.poem).toLowerCase().indexOf(q) >= 0;
    }) : DATA.slice();
    wrapOn = !q;
    emptyEl.style.display = view.length ? "none" : "grid";
    bar.classList.toggle("opw-typing", !!q);
    layout(view);
    tgt.x = cam.x = box.cx; tgt.y = cam.y = box.cy;
    anchor = null; fling = false;
    if (q && view.length) {
      tgt.s = cam.s = Math.min(1.2, Math.max(MIN_S,
        Math.min(vw / (box.w + 240), vh / (box.h + 260))));
    } else if (!q) {
      tgt.s = cam.s = vw < 700 ? 0.55 : 0.66;
    }
    applyCam(); rebuild();
  }
  qEl.addEventListener("input", function (e) { apply(e.target.value); });

  /* Dealing again changes the ORDER, which is what moves poets to new places.
     Bumping the jitter seed alone only re-tilted the cards where they stood. */
  root.querySelector(".opw-shuffle").onclick = function () {
    for (var i = view.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = view[i]; view[i] = view[j]; view[j] = t;
    }
    seedSalt = (seedSalt + 1) % 997;
    layout(view); rebuild();
  };

  /* -------------------------------------------------------- the turn
     Not a CSS transition. yaw is eased toward a target every frame, and the
     gloss and the ridge are driven off it — the sheen sweeps and the lens
     ribbing peaks edge-on, which is what makes the card read as an object
     rather than an animation. Click-driven only, so nothing can get stuck
     half-turned, and the poem does not become scrollable until it has landed. */
  var cur = -1, yaw = 0, spinning = false, tFrom = 0, tTo = 0, tStart = 0;
  var TURN_MS = 620;
  function easeInOut(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }

  function paint() {
    flipper.style.transform = "rotateY(" + yaw.toFixed(2) + "deg)";
    var a = ((yaw % 360) + 360) % 360;
    glossEl.style.backgroundPosition = (125 - (a / 180) * 170) + "% 0";
    ridgeEl.style.opacity = (Math.abs(Math.sin(a * Math.PI / 180)) * .20).toFixed(3);
    return a;
  }
  function spin(now) {
    var k = Math.min(1, (now - tStart) / TURN_MS);
    yaw = tFrom + (tTo - tFrom) * easeInOut(k);
    var a = paint();
    if (k >= 1) {
      yaw = tTo; spinning = false;
      var back = a > 90 && a < 270;
      flipper.classList.toggle("opw-landed", back);
      if (back) fade();
      return;
    }
    flipper.classList.remove("opw-landed");   // mid-turn it is an object, not a page
    requestAnimationFrame(spin);
  }
  function turn() {
    if (spinning) return;                     // one turn at a time
    tFrom = yaw; tTo = Math.round(yaw / 180) * 180 + 180;
    tStart = performance.now(); spinning = true;
    requestAnimationFrame(spin);
  }
  function faceFront() {                      // a new poet shows the photo at once
    spinning = false;
    yaw = tFrom = tTo = Math.round(yaw / 360) * 360;
    flipper.classList.remove("opw-landed");
    paint();
  }
  function showingBack() { var a = ((tTo % 360) + 360) % 360; return a > 90 && a < 270; }

  /* Webflow rich text stores poems two ways: <br>-separated lines inside one
     paragraph, or one paragraph per line. In the second case the paragraph
     margin reads as a stanza break on every single line — so find it and
     collapse the spacing. */
  function setLineation(el) {
    var blocks = el.querySelectorAll("p,li");
    var brs = el.querySelectorAll("br").length;
    var perline = false;
    if (blocks.length >= 4 && brs <= blocks.length / 2) {
      var short = 0;
      Array.prototype.forEach.call(blocks, function (b) {
        if (b.textContent.trim().length <= 78) short++;
      });
      perline = short / blocks.length > 0.72;
    }
    el.classList.toggle("opw-perline", perline);
    if (perline) Array.prototype.forEach.call(blocks, function (b) {
      if (!b.textContent.replace(/ /g, " ").trim()) b.classList.add("opw-brk");
    });
  }

  function fade() {
    bwrap.classList.toggle("opw-more",
      bodyEl.scrollHeight - bodyEl.scrollTop - bodyEl.clientHeight > 12);
  }

  var barHide = 0;
  function syncBar() {
    var over = bodyEl.scrollHeight - bodyEl.clientHeight;
    if (over <= 4) { sbar.classList.remove("opw-show"); return false; }
    var track = sbar.clientHeight;
    var h = Math.max(24, track * (bodyEl.clientHeight / bodyEl.scrollHeight));
    sthumb.style.height = h + "px";
    sthumb.style.top = ((track - h) * (bodyEl.scrollTop / over)) + "px";
    return true;
  }
  function showBar(sticky) {
    if (!syncBar()) return;
    sbar.classList.add("opw-show");
    clearTimeout(barHide);
    if (!sticky) barHide = setTimeout(function () { sbar.classList.remove("opw-show"); }, 1100);
  }
  bodyEl.addEventListener("scroll", function () { fade(); showBar(false); }, { passive: true });
  backEl.addEventListener("pointerenter", function () { showBar(true); });
  backEl.addEventListener("pointermove", function () { showBar(true); });
  backEl.addEventListener("pointerleave", function () {
    clearTimeout(barHide); sbar.classList.remove("opw-show");
  });

  /* ------------------------------------------------------------ opening
     The card grows out of the exact rectangle of the tile you clicked, tilt
     included, so it is understood to BE that card. */
  var EASE = "cubic-bezier(.19,.86,.24,1)";

  flipwrap.addEventListener("pointerenter", function () { reader.style.setProperty("--opw-lit", "1"); });
  flipwrap.addEventListener("pointermove", function (e) {
    var r = flipwrap.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    reader.style.setProperty("--opw-sx", x.toFixed(3));
    reader.style.setProperty("--opw-sy", y.toFixed(3));
    cardtilt.style.transform = "rotateX(" + (-(y - .5) * 13.6).toFixed(2) + "deg) rotateY(" +
      ((x - .5) * 16).toFixed(2) + "deg)";
  });
  flipwrap.addEventListener("pointerleave", function () {
    reader.style.setProperty("--opw-lit", "0");
    reader.style.setProperty("--opw-sx", ".5");
    reader.style.setProperty("--opw-sy", ".5");
    cardtilt.style.transform = "none";
  });

  function tileAngle(el) {
    var m = /rotate\(([-\d.]+)deg\)/.exec(el.style.transform || "");
    return m ? parseFloat(m[1]) : 0;
  }

  function playOpen(fromEl) {
    if (!flipwrap.animate || !fromEl) return;
    var D = 520;
    var to = flipwrap.getBoundingClientRect();
    var r = fromEl.getBoundingClientRect();
    var s = Math.max(0.08, r.width / to.width);
    var dx = (r.left + r.width / 2) - (to.left + to.width / 2);
    var dy = (r.top + r.height / 2) - (to.top + to.height / 2);
    flipwrap.animate([
      { transform: "translate(" + dx + "px," + dy + "px) scale(" + s + ") rotate(" +
        (tileAngle(fromEl) * cam.s) + "deg)", opacity: .45 },
      { transform: "none", opacity: 1 }
    ], { duration: D, easing: EASE });
    reader.animate([{ opacity: 0 }, { opacity: 1 }], { duration: Math.round(D * .75), easing: "ease-out" });
  }

  var htmlOverflow = "";
  function open(i, fromEl) {
    if (i < 0 || i >= view.length) return;
    cur = i;
    var d = view[i];
    faceFront();
    fimg.src = d.img;
    fimg.alt = altFor(d);
    reader.querySelector(".opw-nm").textContent = d.name;
    reader.querySelector(".opw-cr").textContent = d.credit ? "photo · " + d.credit : "";
    reader.querySelector(".opw-who").textContent = d.name;
    reader.querySelector(".opw-bhead h2").textContent = d.poem;
    bodyEl.innerHTML = d.html;
    setLineation(bodyEl);
    bodyEl.scrollTop = 0;
    mainLink.href = SITE + "/poems/" + d.slug;
    /* Poets without an interview usually have only the one poem, so "all their
       poems" overpromises. */
    mainLink.textContent = d.interview ? "Read all their poems" : "See their feature";
    bfoot.classList.toggle("opw-solo", !d.interview);
    if (d.interview) viewLink.href = SITE + "/interviews/" + d.interview;

    var wasOpen = reader.classList.contains("opw-open");
    reading = true;
    layer.classList.add("opw-blur");
    bar.classList.add("opw-off"); zoomEl.classList.add("opw-off"); hintEl.classList.add("opw-off");
    if (!wasOpen) {
      htmlOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = "hidden";
    }
    reader.classList.add("opw-open");
    if (!wasOpen) playOpen(fromEl);
    requestAnimationFrame(function () { fade(); syncBar(); });
  }

  function shut() {
    reader.classList.remove("opw-open");
    layer.classList.remove("opw-blur");
    bar.classList.remove("opw-off"); zoomEl.classList.remove("opw-off"); hintEl.classList.remove("opw-off");
    document.documentElement.style.overflow = htmlOverflow;
    reading = false;
    sbar.classList.remove("opw-show");
    cur = -1;
    lastKey = "";               // catch up on anything that moved while we were away
    populate();
  }
  function step(n) { if (cur < 0) return; open((cur + n + view.length) % view.length); }

  frontEl.onclick = function () { if (!showingBack()) turn(); };

  /* Tapping the poem side turns the card back — but a tap has to be told apart
     from a scroll drag, so it is measured rather than trusting click. */
  var bdown = null;
  backEl.addEventListener("pointerdown", function (e) {
    bdown = { x: e.clientX, y: e.clientY, t: performance.now(), top: bodyEl.scrollTop };
  });
  backEl.addEventListener("pointerup", function (e) {
    if (!bdown) return;
    var d = bdown; bdown = null;
    if (e.target.closest("a")) return;                              // let links work
    if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 8) return;   // a drag
    if (performance.now() - d.t > 500) return;                      // a hold
    if (bodyEl.scrollTop !== d.top) return;                         // a scroll
    if (showingBack()) turn();
  });

  reader.querySelector(".opw-x").onclick = shut;
  reader.querySelector(".opw-prev").onclick = function () { step(-1); };
  reader.querySelector(".opw-next").onclick = function () { step(1); };
  reader.addEventListener("click", function (e) { if (e.target === reader) shut(); });

  document.addEventListener("keydown", function (e) {
    if (!reader.classList.contains("opw-open")) return;
    if (e.key === "Escape") shut();
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === " ") { e.preventDefault(); turn(); }
  });

  var tsx = null;
  reader.addEventListener("touchstart", function (e) { tsx = e.touches[0].clientX; }, { passive: true });
  reader.addEventListener("touchend", function (e) {
    if (tsx === null) return;
    var dx = e.changedTouches[0].clientX - tsx; tsx = null;
    if (Math.abs(dx) > 64) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  /* ------------------------------------------------ keep the page honest
     The page carries the index as real HTML. This puts it back in step with
     the data if a poet has been published since the last time the page was,
     using the class vocabulary the page already uses, and writes only when
     something has actually changed. */
  function refreshIndex() {
    var host = document.querySelector(".op-poets-index-inner");
    if (!host) return;
    var names = DATA.slice().sort(function (a, b) {
      return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
    });
    var html = names.map(function (d) {
      return '<li class="op-poets-item"><a class="op-poets-link" href="/poems/' + d.slug + '">' +
        esc(d.name) + "</a></li>";
    }).join("");
    if (host.innerHTML !== html) host.innerHTML = html;
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function fail() {
    root.innerHTML = '<p style="font-family:var(--opw-ui);font-size:11px;letter-spacing:.02em;' +
      'color:rgba(5,33,78,.62);padding:40px 0">The wall could not load — ' +
      'the full list of poets is below.</p>';
    var idx = document.querySelector(".op-poets-index");
    if (idx) idx.className += " opw-show";
  }

  /* ---------------------------------------------------------------- go */
  resize();

  fetch(SRC, { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .catch(function () { return fetch(SRC).then(function (r) { return r.json(); }); })
    .then(function (rows) {
      if (!rows || !rows.length) throw 0;
      DATA = rows;
      for (var i = DATA.length - 1; i > 0; i--) {   // a fresh order on every visit
        var j = Math.floor(Math.random() * (i + 1));
        var t = DATA[i]; DATA[i] = DATA[j]; DATA[j] = t;
      }
      try { refreshIndex(); } catch (e) { /* the page's own index stands */ }
      apply("");
    })
    .catch(function () { fail(); });
})();
