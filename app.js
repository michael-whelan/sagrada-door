(function () {
  var LANGS = window.LANGS.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
  var $ = function (id) { return document.getElementById(id); };
  var q = $("q"), list = $("list"), clearBtn = $("clear"), status = $("status"), jump = $("jump");
  var door = $("door"), stage = door.querySelector(".stage"), holes = $("holes"), rings = $("rings"), hl = $("hl");
  var panel = $("panel"), closeBtn = $("close");
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
  clearBtn.addEventListener("click", function () { reset(); q.focus(); });

  /* ---------- highlight ---------- */
  function rect(b, pad) {
    var r = document.createElementNS(NS, "rect");
    r.setAttribute("x", b[0] - pad); r.setAttribute("y", b[1] - pad * 0.6);
    r.setAttribute("width", b[2] + pad * 2); r.setAttribute("height", b[3] + pad * 1.2);
    return r;
  }

  function drawHighlight(lang) {
    holes.innerHTML = ""; rings.innerHTML = "";
    var boxes = lang && lang.boxes || [];
    boxes.forEach(function (b) {
      var h = rect(b, 0.5); h.setAttribute("fill", "#000"); holes.appendChild(h);
      var r = rect(b, 0.5); r.addEventListener("click", onRingClick); rings.appendChild(r);
    });
    hl.classList.toggle("on", boxes.length > 0);
    door.classList.toggle("on", boxes.length > 0);
  }

  function center(lang) {
    var b = lang.boxes[0]; return { x: b[0] + b[2] / 2, y: b[1] + b[3] / 2 };
  }

  /* ---------- text panel ---------- */
  function fillPanel(lang) {
    $("p-name").textContent = lang.name + (lang.native !== lang.name ? " · " + lang.native : "");
    var notes = [];
    if (!lang.boxes.length) notes.push("Not located on the photo yet.");
    if (lang.note) notes.push(lang.note);
    if (lang.verify && lang.text) notes.push("Text to check against a trusted source.");
    $("p-note").textContent = notes.join(" ");
    var t = $("p-text");
    t.className = "prayer" + (lang.dir === "rtl" ? " rtl" : "") + (lang.text ? "" : " pending");
    t.setAttribute("lang", lang.id);
    t.textContent = lang.text || "The full text for this language hasn't been added yet.";
  }

  function hidePanel() { clearTimeout(timer); panel.classList.remove("show"); }

  function showPanel() {
    if (!current) return;
    if (desktop.matches) {
      var top = !current.boxes.length || center(current).y >= 50; // keep the panel off the highlight
      panel.classList.toggle("at-top", top);
      panel.classList.toggle("at-bottom", !top);
      panel.classList.add("show");
    }
  }

  /* ---------- selecting ---------- */
  function select(lang) {
    current = lang; q.value = lang.name; clearBtn.hidden = false; closeList(); q.blur();
    fillPanel(lang); panel.classList.add("has"); drawHighlight(lang);
    hidePanel();
    if (lang.boxes.length) {
      status.textContent = desktop.matches ? lang.name + " highlighted on the door." : lang.name + " highlighted. Tap it to jump to the full text.";
    } else status.textContent = lang.name + " hasn't been located on the door yet.";
    jump.hidden = desktop.matches;
    if (EDIT) status.textContent += " [edit: drag on the door to redraw, shift-drag to add a box]";
    if (desktop.matches) {
      timer = setTimeout(showPanel, 900); // short delay, then fade in
    }
    // bring the highlight into view on small screens
    if (!desktop.matches && lang.boxes.length) {
      var r = stage.getBoundingClientRect(), y = r.top + window.scrollY + r.height * center(lang).y / 100;
      window.scrollTo({ top: Math.max(0, y - window.innerHeight * 0.35), behavior: "smooth" });
    }
  }

  function reset() {
    current = null; q.value = ""; clearBtn.hidden = true; hidePanel(); panel.classList.remove("has");
    drawHighlight(null); jump.hidden = true; status.textContent = "Tap the door or search to find a language.";
  }

  function onRingClick(e) {
    if (EDIT) return;
    e.stopPropagation();
    if (desktop.matches) { panel.classList.contains("show") ? hidePanel() : showPanel(); }
    else panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  jump.addEventListener("click", function () { panel.scrollIntoView({ behavior: "smooth", block: "start" }); });
  closeBtn.addEventListener("click", hidePanel);

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
