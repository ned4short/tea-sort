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
     Each time a level starts, there's a TICKET_CHANCE chance the golden ticket hides
     somewhere on the page: peeking out from behind a cup, in the list of teas, or in the footer.
     Once a player finds it, it's saved in their browser and doesn't appear again for them. */
  var TICKET_CHANCE = 1 / 6;
  var TICKET_KEY = "teasort.goldenticket.v1";
  var boardArea = board.parentNode;
  var ticketSpot = null;

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
    ticketSpot = null;
    el.ticket.hidden = true;
    el.ticket.classList.remove("inline");
    el.ticket.style.left = el.ticket.style.top = "";
    if (el.ticket.parentNode !== boardArea) boardArea.appendChild(el.ticket);
  }
  function maybeHideTicketOnPage() {
    hideTicket();
    if (loadTicket() || Math.random() >= TICKET_CHANCE) return;
    var r = Math.random();
    el.ticket.style.setProperty("--rot", (Math.round(Math.random() * 40) - 20) + "deg");
    if (r < 0.6) {
      ticketSpot = { type: "cup", cup: Math.floor(Math.random() * state.cups.length), side: Math.random() < 0.5 };
    } else {
      var spots = r < 0.85 ? document.querySelectorAll("#teaKey li") : document.querySelectorAll(".site-footer nav a");
      var host = spots[Math.floor(Math.random() * spots.length)];
      if (!host) return;
      ticketSpot = { type: "inline" };
      el.ticket.classList.add("inline");
      host.parentNode.insertBefore(el.ticket, host.nextSibling);
    }
    el.ticket.hidden = false;
    positionTicket();
  }
  function positionTicket() {
    if (!ticketSpot || ticketSpot.type !== "cup") return;
    var cup = board.children[Math.min(ticketSpot.cup, board.children.length - 1)];
    if (!cup) return;
    el.ticket.style.left = (cup.offsetLeft + (ticketSpot.side ? cup.offsetWidth - 26 : -30)) + "px";
    el.ticket.style.top = (cup.offsetTop + cup.offsetHeight - 34) + "px";
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
    maybeHideTicketOnPage();
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

  function render(newLayers) {
    board.innerHTML = "";
    state.cups.forEach(function (cup, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "cup" + (i === state.selected ? " selected" : "") + (isDone(cup) ? " done" : "");
      b.setAttribute("aria-label", cupLabel(cup, i));
      b.dataset.index = i;
      b.innerHTML = '<span class="steam" aria-hidden="true"><span></span><span></span><span></span></span>' +
        '<span class="saucer" aria-hidden="true"></span><span class="handle" aria-hidden="true"></span>';
      var glass = document.createElement("span");
      glass.className = "glass";
      glass.setAttribute("aria-hidden", "true");
      cup.forEach(function (x, j) {
        var tea = TEAS[x];
        var layer = document.createElement("span");
        layer.className = "layer" + (tea.light ? " light" : "");
        if (newLayers && newLayers.cup === i && j >= cup.length - newLayers.count) layer.className += " pour-in";
        layer.style.background = tea.color;
        layer.textContent = tea.glyph;
        layer.title = tea.name;
        glass.appendChild(layer);
      });
      b.appendChild(glass);
      b.addEventListener("click", onCupClick);
      board.appendChild(b);
    });
    el.level.textContent = state.level;
    el.moves.textContent = state.moves;
    el.undo.disabled = !state.history.length || state.busy;
    el.extra.disabled = state.extraUsed || state.busy;
    positionTicket();
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
  el.next.addEventListener("click", function () { closeOverlay(el.win); startLevel(state.level + 1); });
  el.replay.addEventListener("click", function () { closeOverlay(el.win); startLevel(state.level); });
  if (el.share) el.share.addEventListener("click", function (e) { e.preventDefault(); share(); });
  el.ticket.addEventListener("click", claimTicket);
  el.closeTicket.addEventListener("click", function () { closeOverlay(el.ticketOverlay); });
  el.myTicket.addEventListener("click", function () { var t = loadTicket(); if (t) showTicket(t); });
  if (loadTicket()) el.myTicket.hidden = false;
  window.addEventListener("resize", positionTicket);
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
