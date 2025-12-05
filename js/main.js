/**
 * main.js - final integrated version
 * - Defensive profile-duplicate guard (monkey-patch + MutationObserver + cleanup)
 * - Mobile-aware adjustments (disable heavy plugins on touch, adaptive fullHeight)
 * - Debounced scroll handlers, init guard to avoid double-exec
 *
 * If your profile element uses a different selector, replace PROFILE_SEL below (e.g. '#profile' or '.user-profile').
 */

(function () {
  // ------------ Defensive guard for duplicate profile elements ------------
  var PROFILE_SEL = ".profile"; // change if your profile selector differs

  if (window.__ftco_main_initialized) {
    console.warn("ftco main already initialized — skipping duplicate init");
    return;
  }
  window.__ftco_main_initialized = true;

  // Debounce helper
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

  // Remove duplicate profiles (keep first)
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
      // ignore errors
    }
  }

  // Run quick cleanup on key events
  var cleanupDebounced = debounce(removeDuplicateProfiles, 40);
  window.addEventListener("scroll", cleanupDebounced, { passive: true });
  window.addEventListener("resize", cleanupDebounced);
  window.addEventListener("orientationchange", cleanupDebounced);
  document.addEventListener("DOMContentLoaded", removeDuplicateProfiles);
  window.addEventListener("load", removeDuplicateProfiles);

  // MutationObserver to remove duplicated nodes immediately when added
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
      if (found) {
        removeDuplicateProfiles();
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  } catch (e) {
    // fallback: periodic cleanup
    setInterval(removeDuplicateProfiles, 1000);
  }

  // Monkey-patch appendChild/insertBefore to block insertion of a node containing profile when one already exists
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
        } catch (e) {
          // fall through to original
        }
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
      // don't break if patching fails
    }
  })();

  // ---------- Mobile / device helpers ----------
  function isTouchDevice() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  }
  function isSmallScreen() {
    return window.innerWidth <= 768;
  }

  // Reusable safe reflow (runs on resize/orientation)
  function safeReflow() {
    removeDuplicateProfiles();
    applyFullHeightBehavior();
  }

  // ---------------- Main site logic (wrapped to use jQuery if available) ----------------
  // Initialize AOS safely (disable on small screens for stability/performance)
  if (typeof AOS !== "undefined") {
    try {
      if (isSmallScreen()) {
        AOS.init({ disable: true });
      } else {
        AOS.init({ duration: 800, easing: "slide" });
      }
    } catch (e) {}
  }

  (function ($) {
    "use strict";

    // Parallax (Stellar.js) - disable on touch devices
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

    // Full height sections - mobile-friendly
    var applyFullHeightBehavior = function () {
      if (isSmallScreen()) {
        $(".js-fullheight").css({
          height: "auto",
          "min-height": $(window).height() + "px",
        });
        // On mobile we don't continuously rebind heavy resize handlers
        return;
      }

      var setHeight = function () {
        $(".js-fullheight").css("height", $(window).height());
      };

      setHeight();
      $(window).off("resize.ftco_fullheight").on("resize.ftco_fullheight", setHeight);
    };
    applyFullHeightBehavior();

    // Reflow on orientation / resize
    var reflowDebounced = debounce(safeReflow, 150);
    window.addEventListener("orientationchange", reflowDebounced, false);
    window.addEventListener("resize", reflowDebounced, false);

    // Loader
    var loader = function () {
      setTimeout(function () {
        var $loader = $("#ftco-loader");
        if ($loader.length > 0) {
          $loader.removeClass("show");
        }
      }, 1);
    };
    loader();

    // Scrollax init (avoid on touch devices)
    if (typeof $.Scrollax !== "undefined" && !isTouchDevice()) {
      try {
        $.Scrollax();
      } catch (e) {}
    }

    // Burger Menu (touch-friendly)
    var burgerMenu = function () {
      $("body").on("click touchstart", ".js-fh5co-nav-toggle", function (event) {
        if (event.type === "touchstart") event.preventDefault();
        var $this = $(this);
        if ($("#ftco-nav").is(":visible")) {
          $this.removeClass("active");
        } else {
          $this.addClass("active");
        }
      });
    };
    burgerMenu();

    // Smooth scrolling for nav links
    var onePageClick = function () {
      $(document).on("click", '#ftco-nav a[href^="#"]', function (event) {
        event.preventDefault();

        var target = $($.attr(this, "href"));
        if (!target.length) return;

        var dur = isSmallScreen() ? 600 : 500;
        $("html, body").animate({ scrollTop: target.offset().top - 70 }, dur);
      });
    };
    onePageClick();

    // Hero / home carousel
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

    // Navbar dropdown hover (harmless on touch)
    $("nav .dropdown").hover(
      function () {
        var $this = $(this);
        $this.addClass("show");
        $this.find("> a").attr("aria-expanded", true);
        $this.find(".dropdown-menu").addClass("show");
      },
      function () {
        var $this = $(this);
        $this.removeClass("show");
        $this.find("> a").attr("aria-expanded", false);
        $this.find(".dropdown-menu").removeClass("show");
      }
    );

    $("#dropdown04").on("show.bs.dropdown", function () {
      console.log("show");
    });

    // Navbar scroll behavior (debounced). thresholds adapt to screen size
    var scrollWindow = function () {
      var $w = $(window),
        st = $w.scrollTop(),
        navbar = $(".ftco_navbar"),
        sd = $(".js-scroll-wrap");

      var thresh1 = isSmallScreen() ? 80 : 150;
      var thresh2 = isSmallScreen() ? 160 : 350;

      if (st > thresh1) {
        if (!navbar.hasClass("scrolled")) navbar.addClass("scrolled");
      }
      if (st < thresh1) {
        if (navbar.hasClass("scrolled")) navbar.removeClass("scrolled sleep");
      }
      if (st > thresh2) {
        if (!navbar.hasClass("awake")) navbar.addClass("awake");
        if (sd.length > 0) sd.addClass("sleep");
      }
      if (st < thresh2) {
        if (navbar.hasClass("awake")) {
          navbar.removeClass("awake");
          navbar.addClass("sleep");
        }
        if (sd.length > 0) sd.removeClass("sleep");
      }
    };

    $(window).on("scroll", debounce(function () {
      scrollWindow();
      // also ensure duplicates removed while scrolling
      removeDuplicateProfiles();
    }, 50));

    // Counter animation (waypoints) - tweak offset for mobile
    var counter = function () {
      if (!$.fn.waypoint || !$.fn.animateNumber) return;

      $("#section-counter, .hero-wrap, .ftco-counter, .ftco-about").waypoint(
        function (direction) {
          if (direction === "down" && !$(this.element).hasClass("ftco-animated")) {
            var commaStep = $.animateNumber.numberStepFactories.separator(",");
            $(".number").each(function () {
              var $this = $(this),
                num = $this.data("number");
              $this.animateNumber({ number: num, numberStep: commaStep }, 7000);
            });
          }
        },
        { offset: isSmallScreen() ? "110%" : "95%" }
      );
    };
    counter();

    // Content animations (waypoints)
    var contentWayPoint = function () {
      if (!$.fn.waypoint) return;

      var i = 0;
      $(".ftco-animate").waypoint(
        function (direction) {
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
        },
        { offset: isSmallScreen() ? "110%" : "95%" }
      );
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

    // On ready / load: ensure single profile and initial UI state
    $(document).ready(function () {
      removeDuplicateProfiles();
      scrollWindow();
    });

    $(window).on("load", function () {
      removeDuplicateProfiles();
      applyFullHeightBehavior();
      scrollWindow();
    });
  })(jQuery);
})();





