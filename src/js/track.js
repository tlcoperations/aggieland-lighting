/* Aggieland Lighting — action tracking for Google (GA4 + Ads) and Meta.
   Counts the actions that matter for a showroom: calls, directions, store clicks
   and consultation requests. Does nothing until IDs are set in site.json > tracking.

   Any link or button can be tagged by hand:  data-track="call|directions|shop|consult"  */
(function () {
  var cfg = window.AGL_TRACK || {};
  var MAP = {
    // action      GA4 event name         Meta standard event
    call:       { ga: "click_to_call",     meta: "Contact" },
    directions: { ga: "get_directions",    meta: "FindLocation" },
    shop:       { ga: "shop_online_click", meta: "ViewContent" },
    consult:    { ga: "consult_request",   meta: "Lead" }
  };

  // Remember where the visitor came from (ads, Facebook, Google) for this visit.
  var params = new URLSearchParams(location.search);
  var keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];
  var source = {};
  try { source = JSON.parse(sessionStorage.getItem("agl_source") || "{}"); } catch (e) {}
  if (keys.some(function (k) { return params.get(k); })) {
    source = {};
    keys.forEach(function (k) { if (params.get(k)) source[k] = params.get(k); });
    try { sessionStorage.setItem("agl_source", JSON.stringify(source)); } catch (e) {}
  }

  function classify(el) {
    if (el.dataset && el.dataset.track) return el.dataset.track;
    var href = el.getAttribute("href") || "";
    if (href.indexOf("tel:") === 0) return "call";
    if (/maps\.google\.|google\.com\/maps|maps\.apple\./.test(href)) return "directions";
    if (cfg.shopHost && href.indexOf(cfg.shopHost) !== -1) return "shop";
    if (/^\/lighting-consultation\/?(#book)?$/.test(href) || href === "#book") return null; // navigation, not a conversion
    return null;
  }

  // gaOnly: record the GA4 event but skip Google Ads / Meta conversions (used for the form submit,
  // because the real lead conversion fires once on /thanks/ after the form backend accepts it).
  function send(action, label, gaOnly) {
    var m = MAP[action]; if (!m) return;
    var data = { link_text: (label || "").trim().slice(0, 80), page_path: location.pathname };
    for (var k in source) data[k] = source[k];
    if (window.gtag) {
      if (cfg.ga4) gtag("event", m.ga, data);
      var conv = cfg.conversions && cfg.conversions[action];
      if (!gaOnly && cfg.ads && conv) gtag("event", "conversion", { send_to: cfg.ads + "/" + conv });
    }
    if (!gaOnly && window.fbq && cfg.pixel) fbq("track", m.meta, { content_name: action });
  }

  // Clicks on calls, directions and the online store
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("a, button");
    if (!el) return;
    var action = classify(el);
    if (action) send(action, el.textContent);
  }, true);

  // Consultation form (when a form endpoint is set): pass the ad source along, point the redirect
  // at this site's /thanks/ page, block bots that fill the honeypot, and note the GA4 submit.
  document.querySelectorAll("form.form").forEach(function (form) {
    for (var k in source) {
      var i = document.createElement("input");
      i.type = "hidden"; i.name = k; i.value = source[k];
      form.appendChild(i);
    }
    var thanks = location.origin + (form.getAttribute("data-thanks-path") || "/thanks/");
    ["_next", "_redirect"].forEach(function (n) {
      var f = form.elements[n]; if (f) f.value = thanks;
    });
    // Fixture links (/lighting-consultation/?product=...&product_id=...&source=...#book): prefill and pass along.
    var pf = form.elements.product;
    if (pf && params.get("product")) {
      pf.value = params.get("product").slice(0, 200);
      pf.disabled = false; pf.closest("label").hidden = false;
      ["product_id", "source"].forEach(function (n) {
        var f = form.elements[n], v = params.get(n);
        if (f && v) { f.value = v.slice(0, 200); f.disabled = false; }
      });
    }
    if (form.elements.source_page) form.elements.source_page.value = location.pathname;
    form.addEventListener("submit", function (e) {
      var tripped = ["_honey", "_gotcha"].some(function (n) { return form.elements[n] && form.elements[n].value; });
      if (tripped) { e.preventDefault(); return; }
      try { sessionStorage.removeItem("agl_lead_sent"); } catch (err) {}
      send("consult", "consultation form", true);
    });
  });

  // Thank-you page (/thanks/): the form conversion. Counted once per submission.
  if (document.querySelector("[data-lead-thanks]")) {
    var sent = false;
    try { sent = sessionStorage.getItem("agl_lead_sent") === "1"; } catch (e) {}
    if (!sent) {
      try { sessionStorage.setItem("agl_lead_sent", "1"); } catch (e) {}
      if (window.gtag && cfg.ga4) {
        var lead = { form_name: "consultation", page_path: location.pathname };
        for (var key in source) lead[key] = source[key];
        gtag("event", "generate_lead", lead);
      }
      var m = MAP.consult;
      if (window.gtag && cfg.ads && cfg.conversions && cfg.conversions.consult) {
        gtag("event", "conversion", { send_to: cfg.ads + "/" + cfg.conversions.consult });
      }
      if (window.fbq && cfg.pixel) fbq("track", m.meta, { content_name: "consult" });
    }
  }

  // Tag store links so the store's analytics can see visits came from this site
  if (cfg.shopHost) {
    document.querySelectorAll('a[href*="' + cfg.shopHost + '"]').forEach(function (a) {
      try {
        var u = new URL(a.href);
        if (!u.searchParams.get("utm_source")) {
          u.searchParams.set("utm_source", "aggielandlighting.com");
          u.searchParams.set("utm_medium", "referral");
          u.searchParams.set("utm_campaign", "site_" + (location.pathname.replace(/\//g, "") || "home"));
          a.href = u.toString();
        }
      } catch (err) {}
    });
  }

  window.aglTrack = send; // for manual use: aglTrack("consult", "label")
})();
