/**
 * main.js - final integrated & mobile-safe version with robust menu behavior
 *
 * Features:
 * - Defensive duplicate-profile guard (cleanup + MutationObserver + append/insert patch)
 * - Mobile-aware adjustments (disable heavy plugins on touch, adaptive fullHeight)
 * - rAF-driven scroll handling to avoid layout thrash / repeating elements on mobile
 * - Improved burger menu: touch/click friendly, body scroll lock, outside-click close, ESC to close, accessible aria toggles
 * - Debounced expensive tasks, passive scroll listeners
 *
 * NOTE: If your profile element uses a different selector, update PROFILE_SEL below (e.g. '#profile' or '.user-profile').
 */

(function () {
  var PROFILE_SEL = ".profile"; // change to match your profile selector

  // --- Init guard: prevent double-execution ---
  if (window.__ftco_main_initialized) {
    console.warn("ftco main already initialized — skipping duplicate init");
    return;
  }
  window.__ftco_main_initialized = true;

  // --- Utility helpers ---
  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, ms);
    };
  }
  function isTouchDevice() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  }
  function isSmallScreen() {
    return window.innerWidth <= 768;
  }

  // --- Defensive duplicate-profile protections ---
  function removeDuplicateProfiles() {
    try {
      var nodes = document.querySelectorAll(PROFILE_SEL);
      if (nodes && nodes.length > 1) {
        for (var i = 1; i < nodes.length; i++) {
          nodes[i].parentNode && nodes[i].parentNode.removeChild(nodes[i]);
        }
        console.warn("Removed duplicate profile nodes, kept first.");
      }
    } catch (e) {
      // ignore
    }
  }
  var cleanupDebounced = debounce(removeDuplicateProfiles, 40);
  window.addEventListener("scroll", cleanupDebounced, { passive: true });
  window.addEventListener("resize", cleanupDebounced);
  window.addEventListener("orientationchange", cleanupDebounced);
  document.addEventListener("DOMContentLoaded", removeDuplicateProfiles);
  window.addEventListener("load", removeDuplicateProfiles);

  try {
    var obs = new MutationObserver(function (mutations) {
      var found = false;
      for (var m = 0; m < mutations.length; m++) {
        var added = mutations[m].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (n.nodeType === 1) {
            if ((n.matches && n.matches(PROFILE_SEL)) || (n.querySelector && n.querySelector(PROFILE_SEL))) {
              found = true;
              break;
            }
          }
        }
        if (found) break;
      }
      if (found) removeDuplicateProfiles();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  } catch (e) {
    setInterval(removeDuplicateProfiles, 1000);
  }

  (function () {
    try {
      var origAppend = Element.prototype.appendChild;
      Element.prototype.appendChild = function (node) {
        try {
          if (!node) return origAppend.call(this, node);
          if (
            (node.matches && node.matches(PROFILE_SEL)) ||
            (node.querySelector && node.querySelector(PROFILE_SEL))
          ) {
            if (document.querySelector(PROFILE_SEL)) {
              console.warn("Blocked append of duplicate profile node.");
              return node;
            }
          }
        } catch (e) {}
        return origAppend.call(this, node);
      };

      var origInsert = Node.prototype.insertBefore;
      Node.prototype.insertBefore = function (newNode, referenceNode) {
        try {
          if (!newNode) return origInsert.call(this, newNode, referenceNode);
          if (
            (newNode.matches && newNode.matches(PROFILE_SEL)) ||
            (newNode.querySelector && newNode.querySelector(PROFILE_SEL))
          ) {
            if (document.querySelector(PROFILE_SEL)) {
              console.warn("Blocked insertBefore of duplicate profile node.");
              return newNode;
            }
          }
        } catch (e) {}
        return origInsert.call(this, newNode, referenceNode);
      };
    } catch (e) {
      // ignore
    }
  })();

  // --- Safe reflow for mobile/resize/orientation ---
  function applyFullHeightBehavior() {
    if (typeof jQuery === "undefined") return;
    if (isSmallScreen()) {
      jQuery(".js-fullheight").css({ height: "auto", "min-height": jQuery(window).height() + "px" });
      return;
    }
    var setHeight = function () {
      jQuery(".js-fullheight").css("height", jQuery(window).height());
    };
    setHeight();
    jQuery(window).off("resize.ftco_fullheight").on("resize.ftco_fullheight", setHeight);
  }
  var reflowDebounced = debounce(function () {
    removeDuplicateProfiles();
    applyFullHeightBehavior();
  }, 150);
  window.addEventListener("orientationchange", reflowDebounced, false);
  window.addEventListener("resize", reflowDebounced, false);

  // --- AOS init (disable on small screens for stability) ---
  if (typeof AOS !== "undefined") {
    try {
      if (isSmallScreen()) AOS.init({ disable: true });
      else AOS.init({ duration: 800, easing: "slide" });
    } catch (e) {}
  }

  // ---------- Main site logic (jQuery-wrapped) ----------
  (function ($) {
    "use strict";

    // Parallax: skip on touch devices
    if ($.fn.stellar && !isTouchDevice()) {
      try {
        $(window).stellar({
          responsive: true,
          parallaxBackgrounds: true,
          parallaxElements: true,
          horizontalScrolling: false,
          hideDistantElements: false,
          scrollProperty: "scroll",
        });
      } catch (e) {}
    }

    // Full height sections applied initially
    applyFullHeightBehavior();

    // Loader
    var loader = function () {
      setTimeout(function () {
        var $loader = $("#ftco-loader");
        if ($loader.length > 0) $loader.removeClass("show");
      }, 1);
    };
    loader();

    // Scrollax init (avoid on touch)
    if (typeof $.Scrollax !== "undefined" && !isTouchDevice()) {
      try {
        $.Scrollax();
      } catch (e) {}
    }

    // --------------- Improved Burger Menu (robust + accessible) ---------------
    function lockBodyScroll() {
      // simple body lock: add class and set overflow hidden
      document.body.classList.add("ftco-menu-open");
      // inline style fallback
      document.body.style.overflow = "hidden";
    }
    function unlockBodyScroll() {
      document.body.classList.remove("ftco-menu-open");
      document.body.style.overflow = "";
    }

    function closeMenu($toggle, $nav) {
      if ($toggle && $toggle.length) $toggle.removeClass("active").attr("aria-expanded", "false");
      if ($nav && $nav.length) $nav.removeClass("show");
      unlockBodyScroll();
    }

    function openMenu($toggle, $nav) {
      if ($toggle && $toggle.length) $toggle.addClass("active").attr("aria-expanded", "true");
      if ($nav && $nav.length) $nav.addClass("show");
      lockBodyScroll();
    }

    var burgerMenu = function () {
      var $body = $("body");
      var $toggle = $(".js-fh5co-nav-toggle");
      var $nav = $("#ftco-nav");

      // Ensure proper aria attributes
      $toggle.attr("role", "button");
      if (!$toggle.attr("aria-expanded")) $toggle.attr("aria-expanded", "false");

      // Toggle on click or touch
      $body.on("click touchstart", ".js-fh5co-nav-toggle", function (ev) {
        // prevent double-firing in some browsers
        if (ev.type === "touchstart") ev.preventDefault();
        ev.stopPropagation();

        var $this = $(this);
        var isOpen = $this.hasClass("active");
        if (isOpen) {
          closeMenu($this, $nav);
        } else {
          openMenu($this, $nav);
        }
      });

      // Close when clicking a nav link (single page anchor) - good for mobile
      $body.on("click", "#ftco-nav a[href^='#']", function () {
        // give the native behavior time on some devices, then close
        var $t = $toggle;
        setTimeout(function () {
          closeMenu($t, $nav);
        }, 50);
      });

      // Close on outside click / touch
      $(document).on("click touchstart", function (e) {
        // if menu not open, ignore
        if (!$toggle.hasClass("active")) return;
        var target = e.target;
        if ($nav && $nav.length && !$.contains($nav[0], target) && !$.contains($toggle[0], target) && target !== $toggle[0]) {
          closeMenu($toggle, $nav);
        }
      });

      // Close on ESC key
      $(document).on("keydown", function (e) {
        if (e.key === "Escape" || e.keyCode === 27) {
          if ($toggle.hasClass("active")) closeMenu($toggle, $nav);
        }
      });

      // Ensure menu state resets on resize/orientation change (avoid stuck open)
      $(window).on("resize orientationchange", debounce(function () {
        // if nav is visible but viewport switched to desktop, clear locks
        if (!isSmallScreen() && $toggle.hasClass("active")) {
          closeMenu($toggle, $nav);
        }
      }, 150));
    };
    burgerMenu();

    // Smooth scrolling for nav links: prefer native CSS smooth where supported
    // Add CSS rule in your stylesheet: html { scroll-behavior: smooth; }
    var onePageClick = function () {
      $(document).on("click", '#ftco-nav a[href^="#"]', function (event) {
        event.preventDefault();

        var target = $($.attr(this, "href"));
        if (!target.length) return;

        // fallback to jQuery animate for older browsers (duration tuned for mobile)
        var dur = isSmallScreen() ? 600 : 500;
        // Use animate for consistent offset handling
        $("html, body").animate({ scrollTop: target.offset().top - 70 }, dur);
      });
    };
    onePageClick();

    // Hero / home carousel (Owl)
    var carousel = function () {
      if ($.fn.owlCarousel) {
        try {
          $(".home-slider").owlCarousel({
            loop: true,
            autoplay: true,
            margin: 0,
            animateOut: "fadeOut",
            animateIn: "fadeIn",
            nav: false,
            autoplayHoverPause: false,
            items: 1,
            navText: ["<span class='ion-md-arrow-back'></span>", "<span class='ion-chevron-right'></span>"],
            responsive: { 0: { items: 1 }, 600: { items: 1 }, 1000: { items: 1 } },
          });
        } catch (e) {}
      }
    };
    carousel();

    // Navbar behavior: rAF-driven to avoid layout thrash
    (function () {
      var lastScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      var ticking = false;
      var state = { scrolled: null, awake: null };

      function updateNavbarState(scrollY) {
        var $navbar = $(".ftco_navbar");
        var sd = $(".js-scroll-wrap");
        if (!$navbar.length) return;

        var thresh1 = isSmallScreen() ? 80 : 150;
        var thresh2 = isSmallScreen() ? 160 : 350;

        var shouldScrolled = scrollY > thresh1;
        var shouldAwake = scrollY > thresh2;

        if (shouldScrolled !== state.scrolled) {
          state.scrolled = shouldScrolled;
          if (shouldScrolled) $navbar.addClass("scrolled");
          else $navbar.removeClass("scrolled sleep");
        }

        if (shouldAwake !== state.awake) {
          state.awake = shouldAwake;
          if (shouldAwake) {
            $navbar.addClass("awake");
            if (sd.length) sd.addClass("sleep");
          } else {
            $navbar.removeClass("awake");
            $navbar.addClass("sleep");
            if (sd.length) sd.removeClass("sleep");
          }
        }
      }

      var removeDupDuringScroll = debounce(removeDuplicateProfiles, 600);

      function onScroll() {
        lastScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
        if (!ticking) {
          window.requestAnimationFrame(function () {
            try {
              updateNavbarState(lastScrollY);
              removeDupDuringScroll();
            } finally {
              ticking = false;
            }
          });
          ticking = true;
        }
      }

      window.addEventListener("scroll", onScroll, { passive: true });

      document.addEventListener("DOMContentLoaded", function () {
        updateNavbarState(window.pageYOffset || 0);
      });
      window.addEventListener("load", function () {
        updateNavbarState(window.pageYOffset || 0);
      });
      window.addEventListener("resize", debounce(function () {
        state.scrolled = state.awake = null;
        updateNavbarState(window.pageYOffset || 0);
      }, 150));
    })();

    // Counter animation (waypoint)
    var counter = function () {
      if (!$.fn.waypoint || !$.fn.animateNumber) return;
      try {
        $("#section-counter, .hero-wrap, .ftco-counter, .ftco-about").waypoint(function (direction) {
          if (direction === "down" && !$(this.element).hasClass("ftco-animated")) {
            var commaStep = $.animateNumber.numberStepFactories.separator(",");
            $(".number").each(function () {
              var $this = $(this),
                num = $this.data("number");
              $this.animateNumber({ number: num, numberStep: commaStep }, 7000);
            });
          }
        }, { offset: isSmallScreen() ? "110%" : "95%" });
      } catch (e) {}
    };
    counter();

    // Content animations (waypoint)
    var contentWayPoint = function () {
      if (!$.fn.waypoint) return;
      try {
        var i = 0;
        $(".ftco-animate").waypoint(function (direction) {
          if (direction === "down" && !$(this.element).hasClass("ftco-animated")) {
            i++;
            $(this.element).addClass("item-animate");
            setTimeout(function () {
              $("body .ftco-animate.item-animate").each(function (k) {
                var el = $(this);
                setTimeout(function () {
                  var effect = el.data("animate-effect");
                  if (effect === "fadeIn") el.addClass("fadeIn ftco-animated");
                  else if (effect === "fadeInLeft") el.addClass("fadeInLeft ftco-animated");
                  else if (effect === "fadeInRight") el.addClass("fadeInRight ftco-animated");
                  else el.addClass("fadeInUp ftco-animated");
                  el.removeClass("item-animate");
                }, k * 50);
              });
            }, 100);
          }
        }, { offset: isSmallScreen() ? "110%" : "95%" });
      } catch (e) {}
    };
    contentWayPoint();

    // Image popup (MagnificPopup)
    if ($.fn.magnificPopup) {
      try {
        $(".image-popup").magnificPopup({
          type: "image",
          closeOnContentClick: true,
          closeBtnInside: false,
          fixedContentPos: true,
          mainClass: "mfp-no-margins mfp-with-zoom",
          gallery: { enabled: true, navigateByImgClick: true, preload: [0, 1] },
          image: { verticalFit: true },
          zoom: { enabled: true, duration: 300 },
        });

        $(".popup-youtube, .popup-vimeo, .popup-gmaps").magnificPopup({
          disableOn: 700,
          type: "iframe",
          mainClass: "mfp-fade",
          removalDelay: 160,
          preloader: false,
          fixedContentPos: false,
        });
      } catch (e) {}
    }

    // On ready / load: final safety calls
    $(document).ready(function () {
      removeDuplicateProfiles();
      applyFullHeightBehavior();
    });

    $(window).on("load", function () {
      removeDuplicateProfiles();
      applyFullHeightBehavior();
    });
  })(jQuery);
})();






