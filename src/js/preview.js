/* "Place it in your space" fixture preview (/preview/).
   Plain canvas, no libraries, no network. The room photo never leaves the browser.

   Scale: the customer marks two points on something of known length (door height,
   window width, or any custom length in inches).
       pixelsPerInch = distance between the two points (photo pixels) / known inches
   The fixture cutout is then drawn at
       widthIn * pixelsPerInch  by  heightIn * pixelsPerInch
   using the dimensions in src/_data/previewFixtures.json. */
(function () {
  "use strict";

  var dataEl = document.getElementById("pv-data");
  var canvas = document.getElementById("pv-canvas");
  if (!dataEl || !canvas) return;

  var fixtures = JSON.parse(dataEl.textContent);
  var ctx = canvas.getContext("2d");
  var $ = function (id) { return document.getElementById(id); };
  var el = {
    app: $("pv-app"), select: $("pv-fixture"), card: $("pv-card"), photo: $("pv-photo"),
    empty: $("pv-empty"), status: $("pv-status"),
    step3: $("pv-step3"), step4: $("pv-step4"), step5: $("pv-step5"),
    inches: $("pv-inches"), inchesLabel: $("pv-inches-label"), mark: $("pv-mark"),
    markHint: $("pv-mark-hint"), readout: $("pv-scale-readout"),
    rotate: $("pv-rotate"), rotateOut: $("pv-rotate-out"), flip: $("pv-flip"),
    center: $("pv-center"), dims: $("pv-dims"), download: $("pv-download"), send: $("pv-send")
  };

  var MAX_SIDE = 1800;      // longest photo side kept in memory/exported
  var MAX_TILT = 20;        // degrees
  var HANDLE_PX = 22;       // touch target radius, in CSS pixels
  var REF = {
    door: { label: "Door height in inches", first: "the top of the door", second: "the bottom of the door", def: 80 },
    window: { label: "Window width in inches", first: "one side of the window", second: "the other side of the window", def: "" },
    custom: { label: "Length in inches", first: "one end of the object", second: "the other end", def: "" }
  };

  var s = {
    fixture: null, fixImg: null, fixReady: false,
    buf: null, W: 0, H: 0,
    kind: "door", refIn: 80, pts: [], marking: false, ppi: null,
    cx: 0, cy: 0, rot: 0, flip: false
  };
  var pointers = {};
  var drag = null;

  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function fmt(n) { return String(Math.round(n * 10) / 10); }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function say(msg) { el.status.textContent = msg || ""; }
  function k() { var r = canvas.getBoundingClientRect(); return r.width ? canvas.width / r.width : 1; }

  /* ---------- fixture list + card ---------- */
  function findFixture(id) {
    for (var i = 0; i < fixtures.length; i++) if (fixtures[i].id === id) return fixtures[i];
    return null;
  }

  function renderCard(f) {
    el.card.textContent = "";
    var thumb = make("div", "pv-thumb");
    var img = make("img");
    img.src = f.cutout; img.alt = ""; img.width = 96; img.height = 96;
    thumb.appendChild(img);
    var body = make("div", "pv-card-body");
    var title = make("p", "pv-card-title", f.name);
    if (f.sample) title.appendChild(make("span", "pv-badge", "SAMPLE"));
    body.appendChild(title);
    if (f.brand) body.appendChild(make("p", "pv-card-brand", f.brand));
    var dl = make("dl", "pv-dl");
    function row(t, d) { dl.appendChild(make("dt", null, t)); dl.appendChild(make("dd", null, d)); }
    row("Width", fmt(f.widthIn) + " in");
    row("Height", fmt(f.heightIn) + " in");
    if (f.overallLengthIn) row("Overall length", fmt(f.overallLengthIn) + " in");
    if (f.minHangHeightIn) row("Suggested min. height above floor", fmt(f.minHangHeightIn) + " in");
    body.appendChild(dl);
    if (f.notes) body.appendChild(make("p", "pv-card-notes", f.notes));
    if (f.catalogUrl) {
      var a = make("a", "pv-card-link", "View product listing");
      a.href = f.catalogUrl; a.target = "_blank"; a.rel = "noopener";
      body.appendChild(a);
    }
    el.card.appendChild(thumb);
    el.card.appendChild(body);
  }

  function selectFixture(f, updateUrl) {
    s.fixture = f; s.fixReady = false;
    el.select.value = f.id;
    renderCard(f);
    var img = new Image();
    img.onload = function () { if (s.fixture === f) { s.fixImg = img; s.fixReady = true; refresh(); } };
    img.onerror = function () { say("Sorry, the picture for this fixture could not be loaded."); };
    img.src = f.cutout;
    if (updateUrl && window.history && history.replaceState) {
      var u = new URL(location.href);
      u.searchParams.set("fixture", f.id);
      history.replaceState(null, "", u.pathname + u.search + u.hash);
    }
    var q = new URLSearchParams();
    q.set("product", f.name);
    q.set("product_id", f.id);
    q.set("source", "fixture-preview");
    el.send.href = el.app.getAttribute("data-consult-url") + "?" + q.toString() + "#book";
    refresh();
  }

  /* ---------- photo ---------- */
  function loadPhoto(file) {
    if (!file) return;
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      s.W = Math.max(1, Math.round(img.naturalWidth * scale));
      s.H = Math.max(1, Math.round(img.naturalHeight * scale));
      s.buf = document.createElement("canvas");
      s.buf.width = s.W; s.buf.height = s.H;
      s.buf.getContext("2d").drawImage(img, 0, 0, s.W, s.H);
      URL.revokeObjectURL(url);
      canvas.width = s.W; canvas.height = s.H;
      canvas.hidden = false; el.empty.hidden = true; el.step3.hidden = false;
      s.cx = s.W / 2; s.cy = s.H * 0.28; s.rot = 0; s.flip = false;
      el.rotate.value = 0; syncRotateOut(); el.flip.setAttribute("aria-pressed", "false");
      startMarking();
      $("pv-stage").scrollIntoView({ block: "start", behavior: "smooth" });
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      say("That file could not be opened as a photo. Try a JPG or PNG.");
    };
    img.src = url;
  }

  /* ---------- scale reference ---------- */
  function readInches() {
    var v = parseFloat(el.inches.value);
    return v > 0 && v <= 600 ? v : null;
  }

  function startMarking() {
    s.refIn = readInches() || s.refIn;
    s.pts = []; s.ppi = null; s.marking = true;
    say("Tap " + REF[s.kind].first + " in the photo." + (readInches() ? "" : " Also type its length in inches in step 3."));
    refresh();
  }

  function recomputeScale() {
    s.ppi = null;
    var inches = readInches();
    if (s.pts.length === 2 && inches) {
      s.refIn = inches;
      var d = Math.hypot(s.pts[1].x - s.pts[0].x, s.pts[1].y - s.pts[0].y);
      if (d >= 10) s.ppi = d / inches;
    }
  }

  function finishMarkingStatus() {
    if (s.ppi) {
      s.marking = false;
      say("Scale set. Drag the fixture where you want it. You can still drag the two marked points to fine-tune.");
    } else if (s.pts.length === 2 && !readInches()) {
      s.marking = false;
      say("Now type the length in inches (step 3) and the fixture will appear.");
    } else if (s.pts.length === 2) {
      say("Those two points are too close together. Choose Re-mark and try again.");
    } else if (s.pts.length === 1) {
      say("Now tap " + REF[s.kind].second + ".");
    }
  }

  /* ---------- geometry ---------- */
  function fixtureBox() {
    if (!s.ppi || !s.fixture) return null;
    return { w: s.fixture.widthIn * s.ppi, h: s.fixture.heightIn * s.ppi };
  }

  function corners() {
    var b = fixtureBox(), c = Math.cos(s.rot), n = Math.sin(s.rot), out = [];
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (p) {
      var x = p[0] * b.w / 2, y = p[1] * b.h / 2;
      out.push({ x: s.cx + x * c - y * n, y: s.cy + x * n + y * c });
    });
    return out;
  }

  function hitFixture(p, pad) {
    var b = fixtureBox();
    if (!b) return false;
    var dx = p.x - s.cx, dy = p.y - s.cy, c = Math.cos(-s.rot), n = Math.sin(-s.rot);
    var x = dx * c - dy * n, y = dx * n + dy * c;
    return Math.abs(x) <= b.w / 2 + pad && Math.abs(y) <= b.h / 2 + pad;
  }

  function hitPoint(p) {
    var r = HANDLE_PX * k(), best = -1, bd = r;
    s.pts.forEach(function (q, i) {
      var d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d <= bd) { bd = d; best = i; }
    });
    return best;
  }

  function toCanvas(e) {
    var r = canvas.getBoundingClientRect();
    return {
      x: clamp((e.clientX - r.left) * canvas.width / r.width, 0, canvas.width),
      y: clamp((e.clientY - r.top) * canvas.height / r.height, 0, canvas.height)
    };
  }

  /* ---------- drawing ---------- */
  function draw(forExport) {
    if (!s.buf) return;
    ctx.clearRect(0, 0, s.W, s.H);
    ctx.drawImage(s.buf, 0, 0);
    var u = k();

    if (s.ppi && s.fixReady) {
      var b = fixtureBox();
      ctx.save();
      ctx.translate(s.cx, s.cy);
      ctx.rotate(s.rot);
      if (s.flip) ctx.scale(-1, 1);
      ctx.drawImage(s.fixImg, -b.w / 2, -b.h / 2, b.w, b.h);
      ctx.restore();
      if (!forExport) {
        var c = corners();
        ctx.save();
        ctx.lineWidth = 1.5 * u;
        ctx.setLineDash([6 * u, 5 * u]);
        ctx.strokeStyle = "rgba(255,255,255,.9)";
        ctx.beginPath(); c.forEach(function (p, i) { i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }); ctx.closePath(); ctx.stroke();
        ctx.lineDashOffset = 6 * u;
        ctx.strokeStyle = "rgba(40,30,25,.8)";
        ctx.stroke();
        ctx.restore();
      }
    }

    if (forExport) { drawCaption(); return; }

    if (s.pts.length) {
      ctx.save();
      ctx.lineCap = "round";
      if (s.pts.length === 2) {
        [[5, "#ffffff"], [2.5, "#e0791f"]].forEach(function (st) {
          ctx.lineWidth = st[0] * u; ctx.strokeStyle = st[1];
          ctx.beginPath(); ctx.moveTo(s.pts[0].x, s.pts[0].y); ctx.lineTo(s.pts[1].x, s.pts[1].y); ctx.stroke();
        });
        var mx = (s.pts[0].x + s.pts[1].x) / 2, my = (s.pts[0].y + s.pts[1].y) / 2;
        var text = fmt(s.refIn) + " in";
        ctx.font = "700 " + 13 * u + "px sans-serif";
        var tw = ctx.measureText(text).width + 14 * u;
        ctx.fillStyle = "rgba(255,255,255,.95)";
        ctx.fillRect(mx - tw / 2, my - 11 * u, tw, 22 * u);
        ctx.fillStyle = "#3b2a22"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(text, mx, my);
      }
      s.pts.forEach(function (p) {
        ctx.beginPath(); ctx.arc(p.x, p.y, 8 * u, 0, Math.PI * 2);
        ctx.fillStyle = "#fff"; ctx.fill();
        ctx.lineWidth = 3 * u; ctx.strokeStyle = "#e0791f"; ctx.stroke();
      });
      ctx.restore();
    }

    if (drag && drag.type === "pt" && drag.touch) drawLoupe(s.pts[drag.i], u);
  }

  function drawLoupe(p, u) {
    var D = 120 * u, R = D / 2, zoom = 3, src = D / zoom, m = 10 * u;
    var lx = p.x < s.W / 2 && p.y < s.H / 3 ? s.W - m - R : m + R, ly = m + R;
    ctx.save();
    ctx.beginPath(); ctx.arc(lx, ly, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = "#fff"; ctx.fillRect(lx - R, ly - R, D, D);
    ctx.drawImage(s.buf, p.x - src / 2, p.y - src / 2, src, src, lx - R, ly - R, D, D);
    ctx.restore();
    ctx.save();
    ctx.lineWidth = 1.5 * u; ctx.strokeStyle = "#e0791f";
    ctx.beginPath(); ctx.moveTo(lx - R, ly); ctx.lineTo(lx + R, ly); ctx.moveTo(lx, ly - R); ctx.lineTo(lx, ly + R); ctx.stroke();
    ctx.lineWidth = 3 * u; ctx.strokeStyle = "#fff";
    ctx.beginPath(); ctx.arc(lx, ly, R, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function drawCaption() {
    if (!s.fixture) return;
    var size = Math.max(13, Math.round(s.W / 70));
    var text = s.fixture.name + " (" + fmt(s.fixture.widthIn) + " x " + fmt(s.fixture.heightIn) + " in)  |  approximate scale  |  aggielandlighting.com";
    ctx.save();
    ctx.font = "600 " + size + "px sans-serif";
    ctx.textBaseline = "middle";
    var w = ctx.measureText(text).width + size * 1.4, h = size * 2;
    ctx.fillStyle = "rgba(255,255,255,.82)";
    ctx.fillRect(size * 0.6, s.H - h - size * 0.6, Math.min(w, s.W - size * 1.2), h);
    ctx.fillStyle = "#3b2a22";
    ctx.fillText(text, size * 1.3, s.H - h / 2 - size * 0.6, s.W - size * 2.6);
    ctx.restore();
  }

  /* ---------- UI sync ---------- */
  function syncRotateOut() { el.rotateOut.textContent = Math.round(s.rot * 180 / Math.PI) + "\u00b0"; }

  function updateInfo() {
    var ready = !!(s.ppi && s.fixture);
    el.step4.hidden = !ready;
    el.step5.hidden = !ready;
    el.mark.textContent = s.marking ? "Cancel marking" : (s.pts.length ? "Re-mark" : "Mark on photo");
    el.readout.textContent = s.ppi
      ? "Scale set from " + fmt(s.refIn) + " in (about " + fmt(s.ppi) + " photo pixels per inch)."
      : "";
    if (!ready) { el.dims.textContent = ""; return; }
    var f = s.fixture;
    var msg = f.name + " is " + fmt(f.widthIn) + " in wide by " + fmt(f.heightIn) + " in tall.";
    if (f.overallLengthIn) msg += " Overall length with chain or rod: " + fmt(f.overallLengthIn) + " in.";
    if (s.kind === "door" && s.pts.length === 2) {
      var floorY = Math.max(s.pts[0].y, s.pts[1].y);
      var bottom = Math.max.apply(null, corners().map(function (p) { return p.y; }));
      var above = (floorY - bottom) / s.ppi;
      msg += " In this photo the bottom of the fixture is about " + fmt(Math.max(0, above)) + " in above the floor (rough estimate, measured at the door).";
      if (f.minHangHeightIn && above < f.minHangHeightIn) {
        msg += " Suggested minimum is " + fmt(f.minHangHeightIn) + " in.";
      }
    } else if (f.minHangHeightIn) {
      msg += " Suggested minimum height above the floor: " + fmt(f.minHangHeightIn) + " in.";
    }
    el.dims.textContent = msg;
  }

  function refresh() { draw(false); updateInfo(); }

  /* ---------- pointer interaction ---------- */
  function angleBetween(a, b) { return Math.atan2(b.y - a.y, b.x - a.x); }
  function twoPointers() {
    var ids = Object.keys(pointers);
    return ids.length === 2 ? [pointers[ids[0]], pointers[ids[1]]] : null;
  }

  canvas.addEventListener("pointerdown", function (e) {
    if (!s.buf) return;
    e.preventDefault();
    var p = toCanvas(e);
    pointers[e.pointerId] = p;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    var touch = e.pointerType !== "mouse";

    var two = twoPointers();
    if (two && drag && drag.type === "fixture") {
      drag = { type: "twist", last: angleBetween(two[0], two[1]) };
      return;
    }
    if (drag) return;

    if (s.marking && s.pts.length < 2) {
      s.pts.push(p);
      drag = { type: "pt", i: s.pts.length - 1, touch: touch, id: e.pointerId };
      recomputeScale();
      refresh();
      return;
    }
    var i = hitPoint(p);
    if (i >= 0) { drag = { type: "pt", i: i, touch: touch, id: e.pointerId }; refresh(); return; }
    if (s.ppi && hitFixture(p, 10 * k())) {
      drag = { type: "fixture", dx: s.cx - p.x, dy: s.cy - p.y, id: e.pointerId };
      canvas.style.cursor = "grabbing";
    }
  });

  canvas.addEventListener("pointermove", function (e) {
    var p = toCanvas(e);
    if (pointers[e.pointerId]) pointers[e.pointerId] = p;
    if (!drag) {
      if (e.pointerType === "mouse") {
        canvas.style.cursor = (s.marking && s.pts.length < 2) ? "crosshair" : hitPoint(p) >= 0 ? "move" : (s.ppi && hitFixture(p, 10 * k())) ? "grab" : "default";
      }
      return;
    }
    e.preventDefault();
    if (drag.type === "pt") {
      if (e.pointerId !== drag.id) return;
      s.pts[drag.i] = p;
      recomputeScale();
    } else if (drag.type === "fixture") {
      if (e.pointerId !== drag.id) return;
      s.cx = clamp(p.x + drag.dx, 0, s.W);
      s.cy = clamp(p.y + drag.dy, 0, s.H);
    } else if (drag.type === "twist") {
      var two = twoPointers();
      if (!two) return;
      var a = angleBetween(two[0], two[1]), d = a - drag.last;
      if (d > Math.PI) d -= 2 * Math.PI;
      if (d < -Math.PI) d += 2 * Math.PI;
      drag.last = a;
      setRotation(s.rot + d);
      return;
    }
    refresh();
  });

  function endPointer(e) {
    delete pointers[e.pointerId];
    if (!drag) return;
    if (drag.type === "twist") {
      var ids = Object.keys(pointers);
      drag = null;
      if (ids.length === 1 && s.ppi) {
        var p = pointers[ids[0]];
        drag = { type: "fixture", dx: s.cx - p.x, dy: s.cy - p.y, id: Number(ids[0]) };
      }
      return;
    }
    if (e.pointerId !== drag.id) return;
    var wasPoint = drag.type === "pt";
    drag = null;
    canvas.style.cursor = "default";
    if (wasPoint) finishMarkingStatus();
    refresh();
  }
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  /* ---------- controls ---------- */
  function setRotation(rad) {
    var lim = MAX_TILT * Math.PI / 180;
    s.rot = clamp(rad, -lim, lim);
    el.rotate.value = Math.round(s.rot * 180 / Math.PI);
    syncRotateOut();
    refresh();
  }

  function nudge(dxIn, dyIn) {
    if (!s.ppi) return;
    s.cx = clamp(s.cx + dxIn * s.ppi, 0, s.W);
    s.cy = clamp(s.cy + dyIn * s.ppi, 0, s.H);
    refresh();
  }

  el.select.addEventListener("change", function () {
    var f = findFixture(el.select.value);
    if (f) selectFixture(f, true);
  });
  el.photo.addEventListener("change", function () { loadPhoto(el.photo.files && el.photo.files[0]); });

  Array.prototype.forEach.call(document.querySelectorAll('input[name="pv-ref"]'), function (r) {
    r.addEventListener("change", function () {
      s.kind = r.value;
      el.inchesLabel.firstChild.textContent = REF[s.kind].label;
      el.inches.value = REF[s.kind].def;
      el.inches.placeholder = s.kind === "window" ? "e.g. 36" : "e.g. 24";
      if (s.buf && s.pts.length < 2) startMarking();
      else { recomputeScale(); if (!readInches()) say("Type the length in inches to place the fixture."); refresh(); }
    });
  });
  el.inches.addEventListener("input", function () {
    if (s.pts.length === 2) {
      var had = !!s.ppi;
      recomputeScale();
      if (s.ppi && !had) say("Scale set. Drag the fixture where you want it.");
      refresh();
    }
  });
  el.mark.addEventListener("click", function () {
    if (s.marking) { s.marking = false; s.pts = []; s.ppi = null; say("Marking cancelled."); refresh(); }
    else startMarking();
  });

  el.rotate.addEventListener("input", function () { setRotation(parseFloat(el.rotate.value) * Math.PI / 180); });
  el.flip.addEventListener("click", function () {
    s.flip = !s.flip;
    el.flip.setAttribute("aria-pressed", String(s.flip));
    refresh();
  });
  el.center.addEventListener("click", function () {
    s.cx = s.W / 2; s.cy = s.H * 0.28; s.rot = 0; el.rotate.value = 0; syncRotateOut(); refresh();
  });
  $("pv-up").addEventListener("click", function () { nudge(0, -1); });
  $("pv-down").addEventListener("click", function () { nudge(0, 1); });
  $("pv-left").addEventListener("click", function () { nudge(-1, 0); });
  $("pv-right").addEventListener("click", function () { nudge(1, 0); });

  canvas.addEventListener("keydown", function (e) {
    var step = e.shiftKey ? 5 : 1;
    var map = { ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] };
    if (map[e.key] && s.ppi) { e.preventDefault(); nudge(map[e.key][0], map[e.key][1]); }
  });

  el.download.addEventListener("click", function () {
    if (!s.buf || !s.ppi) return;
    draw(true);
    canvas.toBlob(function (blob) {
      draw(false);
      if (!blob) { say("Sorry, the image could not be saved from this browser."); return; }
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "aggieland-preview-" + s.fixture.id + ".jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
      say("Image downloaded.");
    }, "image/jpeg", 0.92);
  });

  window.addEventListener("resize", function () { if (s.buf) refresh(); });

  /* ---------- start ---------- */
  var wanted = new URLSearchParams(location.search).get("fixture");
  var start = (wanted && findFixture(wanted)) || fixtures[0];
  selectFixture(start, false);
  if (wanted && !findFixture(wanted)) {
    say("We couldn't find that fixture, so we picked the first one. Choose another in step 1.");
  }
})();
