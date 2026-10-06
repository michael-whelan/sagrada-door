(function () {
  var LANGS = window.LANGS.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
  var $ = function (id) { return document.getElementById(id); };
  var q = $("q"), list = $("list"), clearBtn = $("clear"), status = $("status"), jump = $("jump");
  var door = $("door"), stage = door.querySelector(".stage"), holes = $("holes"), rings = $("rings"), hl = $("hl");
  var panel = $("panel"), closeBtn = $("close"), head = $("head");
  var gBase = $("g-base"), gBloom = $("g-bloom"), gSweep = $("g-sweep"), clips = $("clips");
  var NS = "http://www.w3.org/2000/svg";
  var desktop = window.matchMedia("(min-width:900px) and (hover:hover)");
  var current = null, active = -1, shown = [], timer = null, EDIT = location.search.indexOf("edit") > -1;

  /* ---------- dropdown ---------- */
  function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

  function renderList(filter) {
    var f = norm(filter || "");
    shown = LANGS.filter(function (l) { return !f || norm(l.name + " " + l.native).indexOf(f) > -1; });
    list.innerHTML = "";
    if (!shown.length) {
      var li = document.createElement("li"); li.className = "empty"; li.textContent = "No language found";
      list.appendChild(li);
    }
    shown.forEach(function (l, i) {
      var li = document.createElement("li");
      li.id = "opt-" + l.id; li.setAttribute("role", "option");
      li.innerHTML = "<span></span><small></small>";
      li.firstChild.textContent = l.name;
      li.lastChild.textContent = l.native === l.name ? "" : l.native;
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
  function beginSearch() { hidePanel(); openList(q.value === (current && current.name) ? "" : q.value); }

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

  /* The lettering "lights up": a pre-computed amber edge map of the door (door-lit.jpg) is revealed
     through soft masks over the chosen boxes, with a bloom underneath and a light sweep along the line.

     HOLE_FILL is how much of the #dim layer is lifted over the selected line (mask luminance:
     #000 removes the dim entirely, #fff leaves it fully on). It has to stay dark-ish: #lit blends
     with `screen`, which can only brighten, so an undimmed backdrop washes the amber out completely.
     Turn it DOWN toward #000 for more of a plain spotlight, UP toward #fff for more amber glow. */
  var HOLE_FILL = "#c0c0c0";

  function drawHighlight(lang) {
    [holes, rings, gBase, gBloom, gSweep, clips].forEach(function (g) { g.innerHTML = ""; });
    var boxes = lang && lang.boxes || [], anims = [];
    /* SMIL ignores prefers-reduced-motion, and a sweep rect that never animates would sit parked
       at its start position as a permanent bright blob - so skip building it altogether. */
    var reduced = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    boxes.forEach(function (b, i) {
      var h = rect(b, 1.2); h.setAttribute("fill", HOLE_FILL); holes.appendChild(h);
      var r = rect(b, 0.5); r.addEventListener("click", onRingClick); rings.appendChild(r);
      var m = rect(b, 0.3); m.setAttribute("fill", "#fff"); gBase.appendChild(m);
      var bl = rect(b, 0.9); bl.setAttribute("fill", "#fff"); gBloom.appendChild(bl);
      if (reduced) return;
      var cp = el("clipPath", { id: "clip" + i }, clips); cp.appendChild(rect(b, 0.3));
      var g = el("g", { "clip-path": "url(#clip" + i + ")" }, gSweep);
      var w = b[2] * 0.5;
      var sw = el("rect", { x: b[0] - w, y: b[1] - 1, width: w, height: b[3] + 2, fill: "url(#sweepGrad)" }, g);
      anims.push(el("animate", { attributeName: "x", from: b[0] - w, to: b[0] + b[2], dur: "1.1s", begin: "indefinite", fill: "freeze" }, sw));
    });
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
    $("p-name").textContent = lang.name;
    var nat = $("p-native");
    nat.textContent = lang.native === lang.name ? "" : lang.native;
    nat.setAttribute("lang", lang.id);
    var notes = [];
    if (!lang.boxes.length) notes.push("Not located on the photo yet.");
    if (lang.note) notes.push(lang.note);
    if (lang.verify && lang.text) notes.push("Text to check against a trusted source.");
    $("p-note").textContent = notes.join(" ");
    var t = $("p-text");
    t.className = "prayer" + (lang.dir === "rtl" ? " rtl" : "") + (lang.text ? "" : " pending");
    t.setAttribute("lang", lang.id);
    t.innerHTML = "";
    lines(lang.text || "The full text for this language hasn't been added yet.").forEach(function (s, i) {
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
    current = lang; q.value = lang.name; clearBtn.hidden = false; closeList(); q.blur();
    fillPanel(lang); panel.classList.add("has"); drawHighlight(lang);
    hidePanel();
    if (lang.boxes.length) {
      status.textContent = desktop.matches ? lang.name + " highlighted on the door." : lang.name + " highlighted. Drag the sheet up to read it.";
    } else status.textContent = lang.name + " hasn't been located on the door yet.";
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
    drawHighlight(null); jump.hidden = true; status.textContent = "Tap the door or search to find a language.";
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

  renderList("");
})();
