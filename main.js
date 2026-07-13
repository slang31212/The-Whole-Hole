/* Seaways MPSS — small progressive-enhancement script */
(function () {
  "use strict";

  // ----- Mobile nav toggle -----
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ----- Footer year -----
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ----- Lightbox for archive drawings -----
  var lightbox = document.getElementById("lightbox");
  if (lightbox) {
    var lbImg = lightbox.querySelector(".lightbox-img");
    var lbClose = lightbox.querySelector(".lightbox-close");

    function openLightbox(src, alt) {
      lbImg.setAttribute("src", src);
      lbImg.setAttribute("alt", alt || "");
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
    }
    function closeLightbox() {
      lightbox.hidden = true;
      lbImg.setAttribute("src", "");
      document.body.style.overflow = "";
    }

    document.querySelectorAll("[data-full]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var img = btn.querySelector("img");
        openLightbox(btn.getAttribute("data-full"), img ? img.getAttribute("alt") : "");
      });
    });
    lbClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
    });
  }

  // ----- Scroll reveal -----
  // Only engage when supported, and tag elements from JS so the page is never
  // left with hidden content if scripting/IntersectionObserver is unavailable.
  var prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !prefersReduced) {
    var selector = ".section-eyebrow, .section-title, .lead, .card, .s-card, .spec, " +
      ".hull-card, .plate, .app-card, .value-strip, .pull-quote, .about-grid, .analogy-head, " +
      ".analogy-sub, .analogy-col, .table-wrap, .lifecycle, .split";
    var els = Array.prototype.slice.call(document.querySelectorAll(selector));
    els.forEach(function (el) { el.classList.add("reveal"); });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );
    els.forEach(function (el) { io.observe(el); });
  }
})();
