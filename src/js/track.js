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

  function send(action, label) {
    var m = MAP[action]; if (!m) return;
    var data = { link_text: (label || "").trim().slice(0, 80), page_path: location.pathname };
    for (var k in source) data[k] = source[k];
    if (window.gtag) {
      if (cfg.ga4) gtag("event", m.ga, data);
      var conv = cfg.conversions && cfg.conversions[action];
      if (cfg.ads && conv) gtag("event", "conversion", { send_to: cfg.ads + "/" + conv });
    }
    if (window.fbq && cfg.pixel) fbq("track", m.meta, { content_name: action });
  }

  // Clicks on calls, directions and the online store
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest("a, button");
    if (!el) return;
    var action = classify(el);
    if (action) send(action, el.textContent);
  }, true);

  // Consultation form (when a form endpoint is set): count it and pass the ad source along
  document.querySelectorAll("form.form").forEach(function (form) {
    for (var k in source) {
      var i = document.createElement("input");
      i.type = "hidden"; i.name = k; i.value = source[k];
      form.appendChild(i);
    }
    form.addEventListener("submit", function () { send("consult", "consultation form"); });
  });

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
