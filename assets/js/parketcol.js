(function () {
  "use strict";

  var root = document.querySelector(".pc-root");
  if (!root) return;

  var config = window.PARKETCOL_CONFIG || {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  root.classList.add("pc-js");

  var analytics = (function () {
    var id = String(config.metrikaId || "");
    var enabled = /^\d+$/.test(id);
    var microGoals = { phone_click: true, product_interest: true, tds_download: true };
    var lastSent = {};

    if (enabled && config.loadMetrika !== false && typeof window.ym !== "function") {
      (function (m, e, t, r, i, k, a) {
        m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
        m[i].l = 1 * new Date();
        k = e.createElement(t); a = e.getElementsByTagName(t)[0];
        k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
      })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
      window.ym(Number(id), "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
    }

    function track(goal, params) {
      if (!microGoals[goal]) return;
      params = params || {};
      var key = goal + "|" + JSON.stringify(params);
      var now = Date.now();
      if (lastSent[key] && now - lastSent[key] < 1500) return;
      lastSent[key] = now;

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: goal, params: params });

      if (enabled && typeof window.ym === "function") {
        window.ym(Number(id), "reachGoal", goal, params);
      }
    }

    return { track: track, enabled: enabled };
  })();

  document.addEventListener("click", function (e) {
    var link = e.target.closest && e.target.closest("a");
    if (!link || !root.contains(link)) return;

    var href = link.getAttribute("href") || "";
    var card = link.closest("[data-product]");
    var product = card ? card.getAttribute("data-product") : "";

    if (href.indexOf("tel:") === 0) {
      var params = { place: link.getAttribute("data-pc-place") || "other" };
      if (product) params.product = product;
      analytics.track("phone_click", params);
      if (product && link.getAttribute("data-pc-goal") === "product_interest") {
        analytics.track("product_interest", { product: product });
      }
    } else if (link.hasAttribute("data-pc-doc")) {
      analytics.track("tds_download", { doc: link.getAttribute("data-pc-doc") });
    }
  });

  if (config.privacyUrl) {
    root.querySelectorAll("[data-pc-privacy-link]").forEach(function (a) {
      a.setAttribute("href", config.privacyUrl);
    });
  }

  var header = root.querySelector("[data-pc-header]");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  var burger = root.querySelector("[data-pc-burger]");
  var nav = root.querySelector("[data-pc-nav]");
  var desktop = window.matchMedia("(min-width: 1080px)");

  function setMenu(open, returnFocus) {
    if (!burger || !nav) return;
    burger.setAttribute("aria-expanded", String(open));
    burger.querySelector(".pc-visually-hidden").textContent = open ? "Закрыть меню" : "Меню";
    nav.classList.toggle("is-open", open);
    if (!open && returnFocus) burger.focus();
  }

  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") !== "true";
      setMenu(open);
      if (open) {
        var first = nav.querySelector("a");
        if (first) first.focus();
      }
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a") && !desktop.matches) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) setMenu(false, true);
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("is-open") && !nav.contains(e.target) && !burger.contains(e.target)) setMenu(false);
    });
    desktop.addEventListener("change", function () { setMenu(false); });
  }

  if (hasIO) {
    var links = {};
    root.querySelectorAll(".pc-nav__link").forEach(function (a) {
      links[a.getAttribute("href").slice(1)] = a;
    });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = links[entry.target.id];
        if (!link || !entry.isIntersecting) return;
        Object.keys(links).forEach(function (k) { links[k].classList.remove("is-active"); });
        link.classList.add("is-active");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(links).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  var reveals = root.querySelectorAll(".pc-reveal");
  if (reduceMotion || !hasIO) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    reveals.forEach(function (el) {
      var siblings = el.parentElement ? el.parentElement.children : [];
      var index = Array.prototype.indexOf.call(siblings, el);
      if (index > 0) el.style.setProperty("--pc-delay", Math.min(index, 4) * 0.08 + "s");
    });
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    reveals.forEach(function (el) { revealer.observe(el); });
  }

  var callbar = root.querySelector("[data-pc-callbar]");
  var hero = root.querySelector("[data-pc-hero]");
  var contacts = document.getElementById("contacts");
  if (callbar && hero && hasIO) {
    var heroVisible = true;
    var contactsVisible = false;
    var updateBar = function () { callbar.classList.toggle("is-visible", !heroVisible && !contactsVisible); };
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting; updateBar();
    }).observe(hero);
    if (contacts) {
      new IntersectionObserver(function (entries) {
        contactsVisible = entries[0].isIntersecting; updateBar();
      }).observe(contacts);
    }
  }

  var cookie = root.querySelector("[data-pc-cookie]");
  if (cookie) {
    var KEY = "pc-cookie-ok";
    var accepted = false;
    try { accepted = window.localStorage.getItem(KEY) === "1"; } catch (err) { accepted = false; }
    if (!accepted) cookie.hidden = false;
    cookie.querySelector("[data-pc-cookie-ok]").addEventListener("click", function () {
      cookie.hidden = true;
      try { window.localStorage.setItem(KEY, "1"); } catch (err) { return; }
    });
  }

  root.querySelectorAll("[data-pc-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
