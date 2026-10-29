/* Tea Sort Puzzle — by NED Air Filters. Plain JS, no dependencies. */
(function () {
  "use strict";

  var CAP = 4;
  var TEAS = {
    a: { name: "Green Tea",     color: "#9cc34a", glyph: "●" },
    b: { name: "Black Tea",     color: "#4e2a1e", glyph: "■" },
    c: { name: "Chai",          color: "#d08a4a", glyph: "▲" },
    d: { name: "Hibiscus",      color: "#d81b60", glyph: "✿" },
    e: { name: "Butterfly Pea", color: "#3949ab", glyph: "◆" },
    f: { name: "Chamomile",     color: "#f4d23c", glyph: "★", light: true },
    g: { name: "Peppermint",    color: "#26a69a", glyph: "✚" },
    h: { name: "Rooibos",       color: "#b5441b", glyph: "♥" },
    i: { name: "Lavender",      color: "#9c7ad6", glyph: "☾" },
    j: { name: "Earl Grey",     color: "#7d8aa3", glyph: "♣" },
    k: { name: "Rose",          color: "#f4a3c0", glyph: "❀", light: true },
    l: { name: "Milk Oolong",   color: "#ecdcb8", glyph: "▼", light: true }
  };
  window.TEA_TYPES = TEAS;

  var LEVELS = window.TEA_LEVELS || [];
  var STORE_KEY = "teasort.progress.v1";

  var board = document.getElementById("board");
  if (!board) return; // not the game page

  var el = {
    level: document.getElementById("levelNum"),
    moves: document.getElementById("moveCount"),
    undo: document.getElementById("undoBtn"),
    restart: document.getElementById("restartBtn"),
    extra: document.getElementById("extraBtn"),
    levels: document.getElementById("levelsBtn"),
    hint: document.getElementById("hintText"),
    win: document.getElementById("winOverlay"),
    winText: document.getElementById("winText"),
    next: document.getElementById("nextBtn"),
    replay: document.getElementById("replayBtn"),
    levelsOverlay: document.getElementById("levelsOverlay"),
    levelGrid: document.getElementById("levelGrid"),
    closeLevels: document.getElementById("closeLevelsBtn"),
    share: document.getElementById("shareBtn"),
    ticket: document.getElementById("goldenTicket"),
    ticketOverlay: document.getElementById("ticketOverlay"),
    ticketCode: document.getElementById("ticketCode"),
    ticketDate: document.getElementById("ticketDate"),
    closeTicket: document.getElementById("closeTicketBtn"),
    myTicket: document.getElementById("myTicketBtn")
  };

  /* ---------- Golden ticket ----------
     The golden ticket can only appear on the "level complete" pop-up. Each time a player
     completes a level there's a TICKET_CHANCE chance it shows up, tucked into a random corner
     of the pop-up. Once a player finds it, it's saved in their browser and doesn't appear again. */
  var TICKET_CHANCE = 1 / 6;
  var TICKET_KEY = "teasort.goldenticket.v1";
  var CORNERS = ["pos-tl", "pos-tr", "pos-bl", "pos-br"];

  function loadTicket() {
    try { var t = JSON.parse(localStorage.getItem(TICKET_KEY) || "null"); return t && t.code ? t : null; } catch (e) { return null; }
  }
  function makeCode() {
    var abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789", out = "", n = new Uint32Array(8);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(n);
    else for (var q = 0; q < 8; q++) n[q] = Math.floor(Math.random() * 1e9);
    for (var k = 0; k < 8; k++) { out += abc[n[k] % abc.length]; if (k === 3) out += "-"; }
    return "TB-" + out;
  }
  function hideTicket() {
    el.ticket.hidden = true;
    CORNERS.forEach(function (c) { el.ticket.classList.remove(c); });
  }
  function maybeShowTicketOnWin() {
    hideTicket();
    if (loadTicket() || Math.random() >= TICKET_CHANCE) return;
    el.ticket.classList.add(CORNERS[Math.floor(Math.random() * CORNERS.length)]);
    el.ticket.style.setProperty("--rot", (Math.round(Math.random() * 40) - 20) + "deg");
    el.ticket.hidden = false;
  }
  function showTicket(t) {
    el.ticketCode.textContent = t.code;
    var d = new Date(t.date);
    el.ticketDate.textContent = "Found " + d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    el.ticketOverlay.classList.add("open");
    el.closeTicket.focus();
  }
  function claimTicket() {
    var t = loadTicket();
    if (!t) {
      t = { code: makeCode(), date: new Date().toISOString(), level: state.level };
      try { localStorage.setItem(TICKET_KEY, JSON.stringify(t)); } catch (e) {}
    }
    hideTicket();
    el.myTicket.hidden = false;
    showTicket(t);
  }

  var progress = loadProgress();
  var state = { level: 1, cups: [], history: [], selected: -1, moves: 0, extraUsed: false, busy: false };

  function loadProgress() {
    var p = { current: 1, completed: {} };
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed.current === "number") p.current = parsed.current;
        if (parsed && parsed.completed) p.completed = parsed.completed;
      }
    } catch (e) { /* storage unavailable: play without saving */ }
    return p;
  }
  function saveProgress() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); } catch (e) {}
  }
  function highestUnlocked() {
    var max = 1;
    for (var k in progress.completed) { if (progress.completed[k]) max = Math.max(max, Number(k) + 1); }
    return Math.min(max, LEVELS.length);
  }

  function parseLevel(n) {
    return LEVELS[n - 1].split(",").map(function (s) { return s.split(""); });
  }

  function startLevel(n) {
    n = Math.max(1, Math.min(LEVELS.length, n));
    state.level = n;
    state.cups = parseLevel(n);
    state.history = [];
    state.selected = -1;
    state.moves = 0;
    state.extraUsed = false;
    progress.current = n;
    saveProgress();
    setHint("Tap a cup to pick it up, then tap another cup to pour.");
    render();
    if (location.hash !== "#level-" + n && history.replaceState) {
      try { history.replaceState(null, "", "#level-" + n); } catch (e) {}
    }
  }

  function topRun(cup) {
    if (!cup.length) return 0;
    var t = cup[cup.length - 1], n = 1;
    while (n < cup.length && cup[cup.length - 1 - n] === t) n++;
    return n;
  }
  function canPour(from, to) {
    var a = state.cups[from], b = state.cups[to];
    if (from === to || !a.length || b.length >= CAP) return 0;
    var t = a[a.length - 1];
    if (b.length && b[b.length - 1] !== t) return 0;
    return Math.min(topRun(a), CAP - b.length);
  }
  function isDone(cup) {
    return cup.length === CAP && cup.every(function (x) { return x === cup[0]; });
  }
  function isSolved() {
    return state.cups.every(function (c) { return c.length === 0 || isDone(c); });
  }

  function cupLabel(cup, i) {
    if (!cup.length) return "Cup " + (i + 1) + ", empty";
    var names = cup.slice().reverse().map(function (x) { return TEAS[x].name; });
    return "Cup " + (i + 1) + ", top to bottom: " + names.join(", ");
  }

  /* ---------- Teacup drawing (SVG) ----------
     viewBox 0 0 120 130. Tea layers are clipped to the inside of the bowl (#cupInside, defined once in index.html). */
  var SVGNS = "http://www.w3.org/2000/svg";
  var FILL_BOTTOM = 110, FILL_TOP = 30, LAYER_H = (FILL_BOTTOM - FILL_TOP) / CAP;
  // half-width of the inside of the bowl at a given height, sampled from its bezier curve
  var bowlSamples = (function () {
    var p0 = [92, 27], p1 = [94, 80], p2 = [78, 106], p3 = [63, 110], pts = [];
    for (var t = 0; t <= 1.0001; t += 0.02) {
      var u = 1 - t;
      pts.push([u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0], u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]]);
    }
    return pts;
  })();
  function bowlHalfWidth(y) {
    for (var k = 1; k < bowlSamples.length; k++) {
      var a = bowlSamples[k - 1], b = bowlSamples[k];
      if (y >= a[1] && y <= b[1]) { var f = (y - a[1]) / ((b[1] - a[1]) || 1); return (a[0] + f * (b[0] - a[0])) - 55; }
    }
    return 8;
  }
  function svgEl(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function shade(hex, amt) { // lighten (amt>0) or darken (amt<0) a #rrggbb colour
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var f = function (c) { return Math.max(0, Math.min(255, Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt)))); };
    return "rgb(" + f(r) + "," + f(g) + "," + f(b) + ")";
  }
  function drawCup(cup, i, newLayers) {
    var svg = svgEl("svg", { viewBox: "0 0 120 142", "class": "teacup", "aria-hidden": "true", focusable: "false" });
    // foot + stem
    svg.appendChild(svgEl("ellipse", { cx: 55, cy: 130, rx: 22, ry: 5.5, "class": "porcelain gold-line" }));
    svg.appendChild(svgEl("path", { d: "M47,115 L63,115 L61,126 L49,126 Z", "class": "porcelain gold-line" }));
    // handle
    svg.appendChild(svgEl("path", { d: "M95,42 C121,38 122,94 84,97", "class": "handle-outer" }));
    svg.appendChild(svgEl("path", { d: "M95,42 C121,38 122,94 84,97", "class": "handle-inner" }));
    // bowl
    svg.appendChild(svgEl("path", { d: "M12,24 C9,84 28,112 46,116 L64,116 C82,112 101,84 98,24 Z", "class": "porcelain" }));
    // tea layers, clipped to the inside of the bowl
    var g = svgEl("g", { "clip-path": "url(#cupInside)" });
    cup.forEach(function (x, j) {
      var tea = TEAS[x];
      var y = FILL_BOTTOM - (j + 1) * LAYER_H;
      var lg = svgEl("g", { "class": "layer" + (newLayers && newLayers.cup === i && j >= cup.length - newLayers.count ? " pour-in" : "") });
      lg.appendChild(svgEl("rect", { x: 8, y: y - 0.4, width: 94, height: LAYER_H + 0.8, fill: tea.color }));
      var t = svgEl("text", { x: 55, y: y + LAYER_H / 2 + 4.5, "text-anchor": "middle", "class": "glyph" + (tea.light ? " light" : "") });
      t.textContent = tea.glyph;
      lg.appendChild(t);
      var title = svgEl("title", {}); title.textContent = tea.name; lg.appendChild(title);
      g.appendChild(lg);
    });
    // tea surface (seen from slightly above) when the cup isn't full
    if (cup.length && cup.length < CAP) {
      var top = TEAS[cup[cup.length - 1]], sy = FILL_BOTTOM - cup.length * LAYER_H;
      g.appendChild(svgEl("ellipse", { cx: 55, cy: sy, rx: Math.max(6, bowlHalfWidth(sy) - 0.5), ry: 3.2, fill: shade(top.color, 0.22) }));
    }
    svg.appendChild(g);
    // bowl outline on top of the tea
    svg.appendChild(svgEl("path", { d: "M12,24 C9,84 28,112 46,116 L64,116 C82,112 101,84 98,24", "class": "gold-line", fill: "none" }));
    // rim + opening
    svg.appendChild(svgEl("ellipse", { cx: 55, cy: 23, rx: 50, ry: 11, "class": "porcelain gold-line" }));
    var full = cup.length === CAP;
    svg.appendChild(svgEl("ellipse", { cx: 55, cy: 23, rx: 40, ry: 7,
      "class": full ? "opening-tea" : "opening", fill: full ? shade(TEAS[cup[CAP - 1]].color, 0.18) : "" }));
    return svg;
  }

  function render(newLayers) {
    board.innerHTML = "";
    state.cups.forEach(function (cup, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "cup" + (i === state.selected ? " selected" : "") + (isDone(cup) ? " done" : "");
      b.setAttribute("aria-label", cupLabel(cup, i));
      b.dataset.index = i;
      b.innerHTML = '<span class="steam" aria-hidden="true"><span></span><span></span><span></span></span>';
      b.appendChild(drawCup(cup, i, newLayers));
      b.addEventListener("click", onCupClick);
      board.appendChild(b);
    });
    el.level.textContent = state.level;
    el.moves.textContent = state.moves;
    el.undo.disabled = !state.history.length || state.busy;
    el.extra.disabled = state.extraUsed || state.busy;
  }

  function setHint(t) { el.hint.textContent = t; }

  function onCupClick(ev) {
    if (state.busy) return;
    var i = Number(ev.currentTarget.dataset.index);
    if (state.selected === -1) {
      if (!state.cups[i].length) { setHint("That cup is empty. Pick a cup with tea in it."); return; }
      if (isDone(state.cups[i])) { setHint("That cup is already perfectly brewed."); }
      state.selected = i;
      render();
      return;
    }
    if (state.selected === i) { state.selected = -1; render(); return; }
    var from = state.selected, n = canPour(from, i);
    if (!n) {
      var btn = board.children[i];
      btn.classList.remove("shake"); void btn.offsetWidth; btn.classList.add("shake");
      setHint(state.cups[i].length >= CAP ? "That cup is full." : "You can only pour onto the same tea, or into an empty cup.");
      // let the player switch selection to a cup with tea
      if (state.cups[i].length) { state.selected = i; setTimeout(render, 300); }
      return;
    }
    pour(from, i, n);
  }

  function pour(from, to, n) {
    state.busy = true;
    var src = board.children[from], dst = board.children[to];
    var sr = src.getBoundingClientRect(), dr = dst.getBoundingClientRect();
    var dir = dr.left >= sr.left ? 1 : -1;
    var dx = dr.left - sr.left - dir * sr.width * 0.55;
    var dy = dr.top - sr.top - 46;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var finish = function () {
      state.history.push(state.cups.map(function (c) { return c.slice(); }));
      for (var k = 0; k < n; k++) state.cups[to].push(state.cups[from].pop());
      state.moves++;
      state.selected = -1;
      state.busy = false;
      render({ cup: to, count: n });
      if (!reduce && src.animate) {
        var again = board.children[from];
        again.style.zIndex = 5;
        again.animate([
          { transform: "translate(" + dx + "px," + dy + "px) rotate(" + (dir * 62) + "deg)" },
          { transform: "translate(0,0) rotate(0deg)" }
        ], { duration: 260, easing: "ease-out" }).onfinish = function () { again.style.zIndex = ""; };
      }
      if (isDone(state.cups[to])) setHint("Perfect brew! " + TEAS[state.cups[to][0]].name + " is sorted.");
      else setHint("");
      if (isSolved()) setTimeout(onWin, reduce ? 50 : 450);
    };
    if (reduce || !src.animate) { finish(); return; }
    src.style.zIndex = 5;
    var anim = src.animate([
      { transform: "translate(0,-18px) rotate(0deg)" },
      { transform: "translate(" + dx + "px," + dy + "px) rotate(" + (dir * 62) + "deg)" }
    ], { duration: 260, easing: "ease-in", fill: "forwards" });
    anim.onfinish = finish;
  }

  function undo() {
    if (!state.history.length || state.busy) return;
    state.cups = state.history.pop();
    state.moves = Math.max(0, state.moves - 1);
    state.selected = -1;
    setHint("Undone.");
    render();
  }

  function addCup() {
    if (state.extraUsed || state.busy) return;
    state.history.push(state.cups.map(function (c) { return c.slice(); }));
    state.cups.push([]);
    state.extraUsed = true;
    setHint("Added one extra empty cup for this level.");
    render();
  }

  function onWin() {
    progress.completed[state.level] = Math.min(progress.completed[state.level] || Infinity, state.moves);
    var last = state.level >= LEVELS.length;
    progress.current = last ? state.level : state.level + 1;
    saveProgress();
    el.winText.textContent = last
      ? "You sorted all " + LEVELS.length + " levels in " + state.moves + " moves on the final one. You're a true tea master!"
      : "Level " + state.level + " sorted in " + state.moves + " moves. Ready for the next pot?";
    el.next.hidden = last;
    maybeShowTicketOnWin();
    el.win.classList.add("open");
    (last ? el.replay : el.next).focus();
  }

  function openLevels() {
    var max = highestUnlocked();
    el.levelGrid.innerHTML = "";
    for (var n = 1; n <= LEVELS.length; n++) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = n;
      if (progress.completed[n]) b.className = "done";
      if (n === state.level) b.className += " current";
      if (n > max) { b.disabled = true; b.setAttribute("aria-label", "Level " + n + ", locked"); }
      else b.setAttribute("aria-label", "Level " + n + (progress.completed[n] ? ", completed" : ""));
      b.addEventListener("click", (function (lv) { return function () { closeOverlay(el.levelsOverlay); startLevel(lv); }; })(n));
      el.levelGrid.appendChild(b);
    }
    el.levelsOverlay.classList.add("open");
    el.closeLevels.focus();
  }
  function closeOverlay(o) { o.classList.remove("open"); }

  function share() {
    var data = { title: "Tea Sort Puzzle", text: "I'm on level " + state.level + " of Tea Sort Puzzle. Can you sort the teas?", url: location.href.split("#")[0] };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    try {
      navigator.clipboard.writeText(data.text + " " + data.url).then(function () { setHint("Link copied. Share it with a friend!"); });
    } catch (e) { setHint("Share this link: " + data.url); }
  }

  el.undo.addEventListener("click", undo);
  el.restart.addEventListener("click", function () { startLevel(state.level); });
  el.extra.addEventListener("click", addCup);
  el.levels.addEventListener("click", openLevels);
  el.closeLevels.addEventListener("click", function () { closeOverlay(el.levelsOverlay); });
  el.next.addEventListener("click", function () { hideTicket(); closeOverlay(el.win); startLevel(state.level + 1); });
  el.replay.addEventListener("click", function () { hideTicket(); closeOverlay(el.win); startLevel(state.level); });
  if (el.share) el.share.addEventListener("click", function (e) { e.preventDefault(); share(); });
  el.ticket.addEventListener("click", claimTicket);
  el.closeTicket.addEventListener("click", function () { closeOverlay(el.ticketOverlay); });
  el.myTicket.addEventListener("click", function () { var t = loadTicket(); if (t) showTicket(t); });
  if (loadTicket()) el.myTicket.hidden = false;
  [el.win, el.levelsOverlay, el.ticketOverlay].forEach(function (o) {
    o.addEventListener("click", function (e) { if (e.target === o) closeOverlay(o); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeOverlay(el.levelsOverlay); closeOverlay(el.win); closeOverlay(el.ticketOverlay); if (state.selected !== -1) { state.selected = -1; render(); } }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); undo(); }
  });

  // Start: #level-N in the URL (if unlocked), otherwise saved progress
  var fromHash = /^#level-(\d+)$/.exec(location.hash);
  var startAt = progress.current;
  if (fromHash) startAt = Math.min(Number(fromHash[1]), highestUnlocked());
  startLevel(startAt);
})();
