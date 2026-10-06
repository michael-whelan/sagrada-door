(function () {
  var LANGS = window.LANGS.slice();
  var $ = function (id) { return document.getElementById(id); };
  var q = $("q"), list = $("list"), clearBtn = $("clear"), status = $("status"), jump = $("jump");
  var door = $("door"), stage = door.querySelector(".stage"), holes = $("holes"), rings = $("rings"), hl = $("hl"), lit = $("lit");
  var panel = $("panel"), closeBtn = $("close"), head = $("head");
  var gBase = $("g-base"), gStrokes = $("g-strokes"), gBloom = $("g-bloom"), gSweep = $("g-sweep"), clips = $("clips");
  var NS = "http://www.w3.org/2000/svg";
  var desktop = window.matchMedia("(min-width:900px) and (hover:hover)");
  var current = null, active = -1, shown = [], timer = null, EDIT = location.search.indexOf("edit") > -1;

  /* ---------- page language ----------
     Three locales, all of them in i18n.js. The door's own content stays in data.js: the English
     name is the key the translations hang off, and the prayers are never translated at all.
     A stored choice wins; otherwise the browser decides, since most visitors here are local. */
  var LOCALES = ["en", "es", "ca"], STORE = "sagrada-page-lang";
  var langs = $("langs");
  var locale = (function () {
    try {
      var saved = localStorage.getItem(STORE);
      if (LOCALES.indexOf(saved) > -1) return saved;
    } catch (e) {}                                   // private mode: fall through to the browser
    var nav = (navigator.language || "en").toLowerCase();
    return nav.indexOf("ca") === 0 ? "ca" : nav.indexOf("es") === 0 ? "es" : "en";
  })();

  function t(k) { return window.UI[locale][k] || window.UI.en[k]; }
  function nameOf(l) { var n = window.UI[locale].names; return (n && n[l.id]) || l.name; }
  function noteOf(l) { var n = window.UI[locale].notes; return (n && n[l.id]) || l.note; }
  /* a language is searchable under every name the page knows for it, not just the one on screen */
  function haystack(l) {
    return [l.name, l.native, window.UI.es.names[l.id], window.UI.ca.names[l.id]].join(" ");
  }

  /* ---------- dropdown ---------- */
  function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

  function renderList(filter) {
    var f = norm(filter || "");
    shown = LANGS.filter(function (l) { return !f || norm(haystack(l)).indexOf(f) > -1; });
    list.innerHTML = "";
    if (!shown.length) {
      var li = document.createElement("li"); li.className = "empty"; li.textContent = t("empty");
      list.appendChild(li);
    }
    shown.forEach(function (l, i) {
      var li = document.createElement("li");
      li.id = "opt-" + l.id; li.setAttribute("role", "option");
      li.innerHTML = "<span></span><small></small>";
      li.firstChild.textContent = nameOf(l);
      li.lastChild.textContent = l.native === nameOf(l) ? "" : l.native;
      li.addEventListener("mousedown", function (e) { e.preventDefault(); select(l); });
      li.addEventListener("touchend", function (e) { e.preventDefault(); select(l); });
      list.appendChild(li);
    });
    setActive(-1);
  }

  function setActive(i) {
    active = i;
    var items = list.querySelectorAll("li[role=option]");
    items.forEach(function (li, n) { li.setAttribute("aria-selected", n === i ? "true" : "false"); });
    if (i >= 0 && items[i]) { items[i].scrollIntoView({ block: "nearest" }); q.setAttribute("aria-activedescendant", items[i].id); }
    else q.removeAttribute("aria-activedescendant");
  }

  /* suggestions only appear once something has been typed */
  function openList(filter) {
    if (!filter) { closeList(); return; }
    renderList(filter); list.hidden = false; q.setAttribute("aria-expanded", "true");
  }
  function closeList() { list.hidden = true; q.setAttribute("aria-expanded", "false"); }

  /* Starting a new search resets the cycle: overlay fades out, highlight stays until a new pick */
  function beginSearch() { hidePanel(); openList(q.value === (current && nameOf(current)) ? "" : q.value); }

  q.addEventListener("focus", function () { q.select(); beginSearch(); });
  q.addEventListener("click", function () { if (list.hidden) beginSearch(); });
  q.addEventListener("input", function () { hidePanel(); openList(q.value); clearBtn.hidden = !q.value; });
  q.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); if (list.hidden) openList(q.value); if (list.hidden) return; setActive(Math.min(active + 1, shown.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(Math.max(active - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); var l = shown[active >= 0 ? active : 0]; if (l && !list.hidden) select(l); }
    else if (e.key === "Escape") { closeList(); hidePanel(); q.blur(); }
  });
  q.addEventListener("blur", function () { setTimeout(closeList, 120); });
  function clearAll() { reset(); q.focus(); }
  clearBtn.addEventListener("click", clearAll);

  /* ---------- highlight ---------- */
  function rect(b, pad) {
    var r = document.createElementNS(NS, "rect");
    r.setAttribute("x", b[0] - pad); r.setAttribute("y", b[1] - pad * 0.6);
    r.setAttribute("width", b[2] + pad * 2); r.setAttribute("height", b[3] + pad * 1.2);
    return r;
  }

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  /* ---------- measuring the letter strokes off the photo ----------
     The glow should follow the carving, not the box. The prayer texts in data.js can't give us
     that: Subirachs' lettering is hand-cut, so any font we rendered across a box would land a few
     pixels off the real glyphs and read as doubled letters. So the mask is measured instead.

     Instead, inside each box we measure how far every pixel sits from its own local background
     (box-blur means from integral images, window ~ one letter height), then judge that against how
     busy the patch already is. What survives is the carving - the lit faces and shadow lines of
     each stroke - and not the flat stone between letters. The result goes into #m-base as an
     image, which is why that mask keeps a separate unfiltered group: the soft #feather that suits
     a box would wipe strokes this thin out entirely.

     getImageData is blocked when the page is opened over file://, so every failure path here
     returns null and drawHighlight falls back to the soft box. */
  var PAD = 0.3;                 // same padding the fallback rect uses, in % of the photo
  var srcCanvas, maskCache = {};

  function source() {
    if (srcCanvas !== undefined) return srcCanvas;
    var im = stage.querySelector("img");
    if (!im.naturalWidth) return null;   // not decoded yet - stay uncached so the next select() retries
    srcCanvas = null;
    try {
      var c = document.createElement("canvas");
      c.width = im.naturalWidth; c.height = im.naturalHeight;
      var cx = c.getContext("2d");
      cx.drawImage(im, 0, 0);
      cx.getImageData(0, 0, 1, 1);       // throws on a tainted canvas (file:// origin)
      srcCanvas = c;
    } catch (e) { srcCanvas = null; }
    return srcCanvas;
  }

  /* summed-area table, so a local mean over any window costs four lookups */
  function integral(a, w, h) {
    var W = w + 1, s = new Float64Array(W * (h + 1));
    for (var y = 0; y < h; y++) {
      for (var x = 0, run = 0; x < w; x++) {
        run += a[y * w + x];
        s[(y + 1) * W + x + 1] = s[y * W + x + 1] + run;
      }
    }
    return s;
  }
  function area(s, W, x0, y0, x1, y1) {
    return s[y1 * W + x1] - s[y0 * W + x1] - s[y1 * W + x0] + s[y0 * W + x0];
  }

  /* 3-tap blur, separably: softens the mask edge without eating a stroke */
  function smooth(a, w, h) {
    var out = new Float32Array(w * h), x, y, i;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      i = y * w + x;
      out[i] = (a[i - (x > 0 ? 1 : 0)] + 2 * a[i] + a[i + (x < w - 1 ? 1 : 0)]) / 4;
    }
    for (x = 0; x < w; x++) for (y = 0; y < h; y++) {
      i = y * w + x;
      a[i] = (out[i - (y > 0 ? w : 0)] + 2 * out[i] + out[i + (y < h - 1 ? w : 0)]) / 4;
    }
  }

  function strokeMask(b) {
    var key = b.join(",");
    if (key in maskCache) return maskCache[key];
    var src = source();
    if (!src) return null;
    var SW = src.width, SH = src.height;
    var x0 = Math.max(0, Math.round((b[0] - PAD) / 100 * SW));
    var y0 = Math.max(0, Math.round((b[1] - PAD * 0.6) / 100 * SH));
    var x1 = Math.min(SW, Math.round((b[0] + b[2] + PAD) / 100 * SW));
    var y1 = Math.min(SH, Math.round((b[1] + b[3] + PAD * 0.6) / 100 * SH));
    var w = x1 - x0, h = y1 - y0, n = w * h;
    if (w < 8 || h < 8) return (maskCache[key] = null);

    var d = src.getContext("2d").getImageData(x0, y0, w, h).data;
    var g = new Float32Array(n), i;
    for (i = 0; i < n; i++) g[i] = (d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114) / 255;

    var W1 = w + 1, r = Math.max(3, Math.round(h * 0.8));   // window of roughly one letter height
    var x, y, ax0, ay0, ax1, ay1, cnt;
    /* how far each pixel sits from its own local background: the lit faces and the shadow
       lines of a stroke both deviate, the flat stone between letters does not */
    var si = integral(g, w, h), dev = new Float32Array(n);
    for (y = 0; y < h; y++) {
      ay0 = Math.max(0, y - r); ay1 = Math.min(h, y + r + 1);
      for (x = 0; x < w; x++) {
        ax0 = Math.max(0, x - r); ax1 = Math.min(w, x + r + 1);
        cnt = (ax1 - ax0) * (ay1 - ay0);
        dev[y * w + x] = Math.abs(g[y * w + x] - area(si, W1, ax0, ay0, ax1, ay1) / cnt);
      }
    }
    /* ...measured against how busy that patch already is, so a line in deep shadow is judged
       on its own terms rather than against the brightly lit part of the door */
    var sa = integral(dev, w, h), m = new Float32Array(n), z;
    for (y = 0; y < h; y++) {
      ay0 = Math.max(0, y - r); ay1 = Math.min(h, y + r + 1);
      for (x = 0; x < w; x++) {
        ax0 = Math.max(0, x - r); ax1 = Math.min(w, x + r + 1);
        cnt = (ax1 - ax0) * (ay1 - ay0);
        i = y * w + x;
        z = dev[i] / (area(sa, W1, ax0, ay0, ax1, ay1) / cnt + 0.004);
        /* the z term finds the strokes; the absolute term vetoes flat stone, where a tiny
           deviation would otherwise normalise up into a false stroke */
        m[i] = Math.min(1, Math.max(0, (z - 1.4) / 1.0)) *
               Math.min(1, Math.max(0, (dev[i] - 0.065) / 0.075));
      }
    }
    smooth(m, w, h);

    var c = document.createElement("canvas"); c.width = w; c.height = h;
    var cx = c.getContext("2d"), out = cx.createImageData(w, h), v;
    for (i = 0; i < n; i++) {
      v = Math.round(Math.min(1, m[i] * 1.3) * 255);
      out.data[i * 4] = out.data[i * 4 + 1] = out.data[i * 4 + 2] = v;
      out.data[i * 4 + 3] = 255;
    }
    cx.putImageData(out, 0, 0);
    return (maskCache[key] = {
      href: c.toDataURL(), x: x0 / SW * 100, y: y0 / SH * 100, w: w / SW * 100, h: h / SH * 100
    });
  }

  /* The lettering "lights up": the door photo itself, sharpened and lifted (filter #boost), is
     revealed through soft masks over the chosen boxes, with a warm spill around it and a light
     sweep along the line. Real letterforms, so the carving still reads.

     HOLE_FILL is how much of the #dim layer is lifted in the soft pool around the selected line
     (mask luminance: #000 removes the dim entirely, #fff leaves it fully on). Keep it dark but
     not black - a little residual dim in the pool is what makes the lit line itself stand out.
     Turn it DOWN toward #000 for a wider bright pool, UP toward #fff for a tighter one. */
  var HOLE_FILL = "#9c9c9c";

  function drawHighlight(lang) {
    [holes, rings, gBase, gStrokes, gBloom, gSweep, clips].forEach(function (g) { g.innerHTML = ""; });
    var boxes = lang && lang.boxes || [], anims = [], boxed = false;
    /* SMIL ignores prefers-reduced-motion, and a sweep rect that never animates would sit parked
       at its start position as a permanent bright blob - so skip building it altogether. */
    var reduced = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    boxes.forEach(function (b, i) {
      var h = rect(b, 1.2); h.setAttribute("fill", HOLE_FILL); holes.appendChild(h);
      var r = rect(b, 0.5); r.addEventListener("click", onRingClick); rings.appendChild(r);
      var sm = strokeMask(b);
      if (sm) el("image", { href: sm.href, x: sm.x, y: sm.y, width: sm.w, height: sm.h, preserveAspectRatio: "none" }, gStrokes);
      else { var m = rect(b, PAD); m.setAttribute("fill", "#fff"); gBase.appendChild(m); boxed = true; }
      var bl = rect(b, 0.9); bl.setAttribute("fill", "#fff"); gBloom.appendChild(bl);
      if (reduced) return;
      var cp = el("clipPath", { id: "clip" + i }, clips); cp.appendChild(rect(b, 0.3));
      var g = el("g", { "clip-path": "url(#clip" + i + ")" }, gSweep);
      var w = b[2] * 0.5;
      var sw = el("rect", { x: b[0] - w, y: b[1] - 1, width: w, height: b[3] + 2, fill: "url(#sweepGrad)" }, g);
      anims.push(el("animate", { attributeName: "x", from: b[0] - w, to: b[0] + b[2], dur: "1.1s", begin: "indefinite", fill: "freeze" }, sw));
    });
    /* glow tuned for thin strokes would blow out a whole box, so the fallback gets its own level */
    lit.classList.toggle("boxed", boxed);
    hl.classList.toggle("on", boxes.length > 0);
    door.classList.toggle("on", boxes.length > 0);
    anims.forEach(function (an) { try { an.beginElement(); } catch (e) {} });
  }

  function center(lang) {
    var b = lang.boxes[0]; return { x: b[0] + b[2] / 2, y: b[1] + b[3] / 2 };
  }

  /* ---------- text panel ---------- */
  /* The prayers are stored as one block of prose; split on sentence ends so the
     reveal has units to stagger and the text reads as verse rather than a slab. */
  function lines(s) {
    return (s.match(/[^.!?؟।。]+[.!?؟।。]*\s*/g) || [s])
      .map(function (x) { return x.trim(); }).filter(Boolean);
  }

  function fillPanel(lang) {
    $("p-name").textContent = nameOf(lang);
    var nat = $("p-native");
    nat.textContent = lang.native === nameOf(lang) ? "" : lang.native;
    nat.setAttribute("lang", lang.id);
    var notes = [];
    if (!lang.boxes.length) notes.push(t("notLocated"));
    if (lang.note) notes.push(noteOf(lang));
    if (lang.verify && lang.text) notes.push(t("verify"));
    $("p-note").textContent = notes.join(" ");
    var t = $("p-text");
    t.className = "prayer" + (lang.dir === "rtl" ? " rtl" : "") + (lang.text ? "" : " pending");
    t.setAttribute("lang", lang.id);
    t.innerHTML = "";
    lines(lang.text || t("pending")).forEach(function (s, i) {
      var ln = document.createElement("span");
      ln.className = "ln"; ln.style.setProperty("--i", i); ln.textContent = s;
      t.appendChild(ln);
    });
  }

  /* restart the staggered fade at the moment the panel actually becomes visible */
  function playReveal() {
    panel.classList.remove("reveal");
    void panel.offsetWidth;
    panel.classList.add("reveal");
  }

  function hidePanel() { clearTimeout(timer); panel.classList.remove("show"); }

  function showPanel() {
    if (!current) return;
    if (desktop.matches) {
      var top = !current.boxes.length || center(current).y >= 50; // keep the panel off the highlight
      panel.classList.toggle("at-top", top);
      panel.classList.toggle("at-bottom", !top);
      panel.classList.add("show");
      playReveal();
    }
  }

  /* ---------- mobile bottom sheet ---------- */
  var sheet = "peek";

  function setSheet(s) {
    sheet = s;
    panel.style.setProperty("--peek", "calc(100% - " + head.offsetHeight + "px)");
    panel.classList.toggle("peek", s === "peek");
    panel.classList.toggle("full", s === "full");
  }

  var startY = 0, baseY = 0, curY = 0, peekY = 0, dragging = false;

  head.addEventListener("pointerdown", function (e) {
    if (desktop.matches || e.target === closeBtn) return;
    peekY = panel.offsetHeight - head.offsetHeight;
    baseY = curY = sheet === "full" ? 0 : peekY;
    startY = e.clientY; dragging = true;
    panel.classList.add("drag");
    head.setPointerCapture(e.pointerId);
  });

  head.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    curY = Math.max(0, Math.min(peekY, baseY + (e.clientY - startY)));
    panel.style.transform = "translateY(" + curY + "px)";
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    panel.classList.remove("drag");
    panel.style.transform = "";
    // a tap (no real movement) toggles; a drag snaps to the nearer state
    if (Math.abs(curY - baseY) < 5) setSheet(sheet === "full" ? "peek" : "full");
    else setSheet(curY < peekY / 2 ? "full" : "peek");
  }
  head.addEventListener("pointerup", endDrag);
  head.addEventListener("pointercancel", endDrag);

  /* ---------- selecting ---------- */
  function select(lang) {
    current = lang; q.value = nameOf(lang); clearBtn.hidden = false; closeList(); q.blur();
    fillPanel(lang); panel.classList.add("has"); drawHighlight(lang);
    hidePanel();
    if (lang.boxes.length) {
      status.textContent = t(desktop.matches ? "onDoor" : "onSheet").replace("{n}", nameOf(lang));
    } else status.textContent = t("missing").replace("{n}", nameOf(lang));
    jump.hidden = desktop.matches;
    if (EDIT) status.textContent += " [edit: drag on the door to redraw, shift-drag to add a box]";
    if (desktop.matches) {
      timer = setTimeout(showPanel, 900); // short delay, then fade in
    } else {
      document.body.classList.add("sheeted");
      setSheet("peek"); playReveal();
    }
    // bring the highlight into view on small screens
    if (!desktop.matches && lang.boxes.length) {
      var r = stage.getBoundingClientRect(), y = r.top + window.scrollY + r.height * center(lang).y / 100;
      window.scrollTo({ top: Math.max(0, y - window.innerHeight * 0.45), behavior: "smooth" });
    }
  }

  function reset() {
    current = null; q.value = ""; clearBtn.hidden = true; hidePanel();
    panel.classList.remove("has", "peek", "full", "reveal");
    document.body.classList.remove("sheeted");
    drawHighlight(null); jump.hidden = true; status.textContent = t("start");
  }

  function onRingClick(e) {
    if (EDIT) return;
    e.stopPropagation();
    if (desktop.matches) { panel.classList.contains("show") ? hidePanel() : showPanel(); }
    else setSheet("full");
  }

  jump.addEventListener("click", function () { setSheet("full"); });
  /* The × is the same action as the × in the search bar, except that on mobile an open
     sheet gets one step first: full -> peek, then peek -> clear. */
  closeBtn.addEventListener("click", function () {
    if (!desktop.matches && sheet === "full") setSheet("peek");
    else clearAll();
  });

  /* ---------- intro: hold dark until the door is decoded, then fade it up ---------- */
  var img = stage.querySelector("img");
  function begin() { requestAnimationFrame(function () { document.body.classList.add("ready"); }); }
  if (img.complete) begin();
  else { img.addEventListener("load", begin); img.addEventListener("error", begin); }
  setTimeout(begin, 4000); // never leave the page dark if the photo stalls

  /* clicking the door itself opens the search */
  stage.addEventListener("click", function () {
    if (EDIT && dragged) { dragged = false; return; }
    window.scrollTo({ top: 0, behavior: "smooth" });
    q.focus(); beginSearch();
  });

  /* ---------- optional edit mode: index.html?edit ---------- */
  var dragged = false;
  if (EDIT) {
    var out = document.createElement("textarea");
    out.rows = 3; out.style.cssText = "width:100%;margin-top:8px;background:#111;color:#9f9;font:12px monospace";
    out.placeholder = "Box JSON appears here after you drag on the door";
    document.body.insertBefore(out, document.querySelector("footer"));
    var start = null, ghost = null;
    var pct = function (e) {
      var r = stage.getBoundingClientRect();
      return [Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)), Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100))];
    };
    stage.addEventListener("pointerdown", function (e) { if (!current) return; start = pct(e); dragged = false; });
    window.addEventListener("pointermove", function (e) {
      if (!start) return;
      var p = pct(e); dragged = true;
      if (!ghost) { ghost = document.createElementNS(NS, "rect"); ghost.setAttribute("fill", "rgba(0,200,255,.25)"); ghost.setAttribute("stroke", "#0cf"); ghost.setAttribute("vector-effect", "non-scaling-stroke"); hl.appendChild(ghost); }
      ghost.setAttribute("x", Math.min(start[0], p[0])); ghost.setAttribute("y", Math.min(start[1], p[1]));
      ghost.setAttribute("width", Math.abs(p[0] - start[0])); ghost.setAttribute("height", Math.abs(p[1] - start[1]));
    });
    window.addEventListener("pointerup", function (e) {
      if (!start) return;
      var p = pct(e), b = [start[0], start[1], p[0] - start[0], p[1] - start[1]].map(function (n) { return Math.round(n * 10) / 10; });
      if (b[2] < 0) { b[0] += b[2]; b[2] = -b[2]; } if (b[3] < 0) { b[1] += b[3]; b[3] = -b[3]; }
      if (ghost) { ghost.remove(); ghost = null; }
      start = null;
      if (!dragged || b[2] < 0.5) return;
      current.boxes = e.shiftKey ? current.boxes.concat([b]) : [b];
      drawHighlight(current);
      out.value = '{ id: "' + current.id + '", boxes: ' + JSON.stringify(current.boxes) + " }";
    });
  }

  /* ---------- applying the page language ---------- */
  function applyLocale() {
    document.documentElement.lang = locale;
    document.title = t("title");
    $("t-h1").textContent = t("h1");
    $("t-sub").textContent = t("sub");
    stage.querySelector("img").alt = t("alt");
    q.placeholder = t("search");
    clearBtn.setAttribute("aria-label", t("clear"));
    closeBtn.setAttribute("aria-label", t("close"));
    jump.textContent = t("jump");
    langs.setAttribute("aria-label", t("langLabel"));
    $("f-credit").textContent = t("credit");
    $("f-gift").textContent = t("gift");
    var site = $("f-site");
    if (site) site.textContent = t("site");
    Array.prototype.forEach.call(langs.children, function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-loc") === locale ? "true" : "false");
    });
    /* the list is alphabetical in whichever language it is showing, so it re-sorts on every switch */
    LANGS.sort(function (a, b) { return nameOf(a).localeCompare(nameOf(b), locale); });
    if (current) {
      q.value = nameOf(current);
      fillPanel(current);
      status.textContent = current.boxes.length
        ? t(desktop.matches ? "onDoor" : "onSheet").replace("{n}", nameOf(current))
        : t("missing").replace("{n}", nameOf(current));
    } else {
      status.textContent = t("start");
    }
    renderList(list.hidden ? "" : q.value);
  }

  langs.addEventListener("click", function (e) {
    var b = e.target.closest("[data-loc]");
    if (!b || b.getAttribute("data-loc") === locale) return;
    locale = b.getAttribute("data-loc");
    try { localStorage.setItem(STORE, locale); } catch (err) {}   // private mode: switch anyway
    applyLocale();
  });

  applyLocale();
})();
