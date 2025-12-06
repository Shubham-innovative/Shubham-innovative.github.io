// main.js - integrated, mobile-safe, drop-in replacement
// Keep vendor libs (jquery, bootstrap, owl, waypoints, magnific, aos) loaded BEFORE this script.

"use strict";

// ---------- AOS init (safe single init) ----------
if (typeof AOS !== "undefined" && !AOS.__initialized) {
  try {
    AOS.init({ duration: 800, easing: "slide", once: true, mirror: false });
    AOS.__initialized = true;
  } catch (e) {
    // ignore
  }
}

(function ($) {
  "use strict";

  // Utility: detect touch / mobile
  var isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

  // ---------- Parallax (Stellar.js) - only if available and not on touch devices ----------
  if ($.fn.stellar && !isTouch) {
    if (!$(window).data("stellar-initialized")) {
      try {
        $(window).stellar({
          responsive: true,
          parallaxBackgrounds: true,
          parallaxElements: true,
          horizontalScrolling: false,
          hideDistantElements: false,
          scrollProperty: "scroll",
        });
        $(window).data("stellar-initialized", true);
      } catch (e) {
        // ignore
      }
    }
  } else {
    // If on touch or not available, gracefully remove any parallax classes
    $(".parallax-section").removeClass("parallax-section");
  }

  // ---------- Full height sections (debounced) ----------
  var fullHeight = function () {
    var resizeTimer;
    var setHeight = function () {
      $(".js-fullheight").each(function () {
        try {
          $(this).css("height", window.innerHeight + "px");
        } catch (e) {}
      });
    };

    $(window).on("resize orientationchange", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        setHeight();
      }, 150);
    });

    setHeight();
  };
  fullHeight();

  // ---------- Loader ----------
  var loader = function () {
    setTimeout(function () {
      var $loader = $("#ftco-loader");
      if ($loader.length > 0) {
        $loader.removeClass("show");
      }
    }, 50);
  };
  loader();

  // ---------- Scrollax init ----------
  if (typeof $.Scrollax !== "undefined" && !$.Scrollax.__initialized) {
    try {
      $.Scrollax();
      $.Scrollax.__initialized = true;
    } catch (e) {}
  }

  // ---------- Burger Menu (Bootstrap-aware) ----------
  var burgerMenu = function () {
    $("body").off("click", ".js-fh5co-nav-toggle").on("click", ".js-fh5co-nav-toggle", function (event) {
      event && event.preventDefault();
      var $this = $(this);
      $this.toggleClass("active");

      var $nav = $("#ftco-nav");
      if ($nav.length) {
        if ($nav.hasClass("collapse")) {
          try {
            $nav.collapse("toggle");
          } catch (e) {
            $nav.toggleClass("visible");
          }
        } else {
          $nav.toggleClass("visible");
        }
      }
    });

    // close nav when a one-page link is clicked (mobile)
    $("body").on("click", "#ftco-nav a[href^='#']", function () {
      var $nav = $("#ftco-nav");
      if ($nav.length && $nav.hasClass("visible")) {
        $nav.removeClass("visible");
        $(".js-fh5co-nav-toggle").removeClass("active");
      }
    });
  };
  burgerMenu();

  // ---------- User-interaction guard (prevent programmatic scroll while user scrolls) ----------
  var userInteracting = false;
  var interactionTimer = null;
  function markInteracting() {
    userInteracting = true;
    clearTimeout(interactionTimer);
    interactionTimer = setTimeout(function () {
      userInteracting = false;
    }, 250);
  }
  ["touchstart", "touchmove", "wheel", "keydown"].forEach(function (ev) {
    window.addEventListener(ev, markInteracting, { passive: true });
  });

  // Stop any running animations when user interacts (prevents programmatic snap)
  ["touchstart", "touchmove", "wheel", "keydown"].forEach(function (ev) {
    window.addEventListener(ev, function () {
      try { $("html, body").stop(true, true); } catch (e) {}
    }, { passive: true });
  });

  // ---------- Smooth scrolling for nav links (safe) ----------
  function safeScrollTo(y, duration) {
    if (userInteracting) return false;
    try {
      $("html, body").stop(true);
      $("html, body").animate({ scrollTop: y }, duration || 500);
    } catch (e) {
      return false;
    }
    return true;
  }

  $(document).off("click", '#ftco-nav a[href^="#"]').on("click", '#ftco-nav a[href^="#"]', function (event) {
    event && event.preventDefault();
    var href = $.attr(this, "href");
    if (!href || href === "#") return;
    var $target = $(href);
    if (!$target.length) return;
    var targetY = Math.max($target.offset().top - 70, 0);
    var didScroll = safeScrollTo(targetY, 500);

    // remove hash to avoid future browser auto-jump
    if (didScroll && history && history.replaceState) {
      try {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      } catch (e) {}
    } else {
      setTimeout(function () {
        if (history && history.replaceState) {
          try {
            history.replaceState(null, "", window.location.pathname + window.location.search);
          } catch (e) {}
        }
      }, 800);
    }

    // close bootstrap collapse if open
    var $navCollapse = $("#ftco-nav.collapse");
    if ($navCollapse.length && $navCollapse.hasClass("show")) {
      try { $navCollapse.collapse("hide"); } catch (err) { $navCollapse.removeClass("show"); }
      $(".js-fh5co-nav-toggle").removeClass("active");
    }
  });

  // ---------- Hero / home carousel (guard re-init) ----------
  var carousel = function () {
    if ($.fn.owlCarousel && !$(".home-slider").data("owl-initialized")) {
      try {
        $(".home-slider").owlCarousel({
          loop: true,
          autoplay: true,
          autoplayTimeout: 6000,
          smartSpeed: 700,
          margin: 0,
          animateOut: "fadeOut",
          animateIn: "fadeIn",
          nav: false,
          autoplayHoverPause: true,
          items: 1,
          navText: ["<span class='ion-md-arrow-back'></span>", "<span class='ion-chevron-right'></span>"],
          responsive: { 0: { items: 1 }, 600: { items: 1 }, 1000: { items: 1 } },
          onInitialized: function () {
            $(".home-slider").data("owl-initialized", true);
          },
        });
      } catch (e) {}
    }
  };
  carousel();

  // ---------- Navbar dropdown hover (touch-safe) ----------
  if (!isTouch) {
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
  } else {
    // on touch devices rely on click events
    $("nav .dropdown > a").on("click", function (e) {
      var $parent = $(this).closest(".dropdown");
      $parent.toggleClass("show");
      $parent.find(".dropdown-menu").toggleClass("show");
      e.preventDefault();
    });
  }

  $("#dropdown04").on("show.bs.dropdown", function () {
    // debug hook (optional)
  });

  // ---------- Throttled scroll handler for navbar behavior (rAF) ----------
  (function scrollWindow() {
    var lastKnownScrollY = 0;
    var ticking = false;
    function onScroll() {
      lastKnownScrollY = window.scrollY;
      requestTick();
    }
    function requestTick() {
      if (!ticking) requestAnimationFrame(update);
      ticking = true;
    }
    function update() {
      var st = lastKnownScrollY;
      var navbar = $(".ftco_navbar");
      var sd = $(".js-scroll-wrap");

      if (st > 150) navbar.addClass("scrolled");
      else navbar.removeClass("scrolled sleep");

      if (st > 350) {
        navbar.addClass("awake");
        if (sd.length) sd.addClass("sleep");
      } else {
        navbar.removeClass("awake").addClass("sleep");
        if (sd.length) sd.removeClass("sleep");
      }
      ticking = false;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
  })();

  // ---------- Counter animation (waypoint guarded) ----------
  var counter = function () {
    if (!$.fn.waypoint || !$.fn.animateNumber) return;

    $("#section-counter, .hero-wrap, .ftco-counter, .ftco-about").waypoint(function (direction) {
      var $el = $(this.element);
      if (direction === "down" && !$el.hasClass("ftco-animated")) {
        $el.addClass("ftco-animated");
        var commaStep = $.animateNumber.numberStepFactories.separator(",");
        $el.find(".number").each(function () {
          var $this = $(this),
            num = $this.data("number") || 0;
          $this.animateNumber({ number: num, numberStep: commaStep }, 7000);
        });
      }
    }, { offset: "95%" });
  };
  counter();

  // ---------- Content animations (waypoint) with single-init guard ----------
  var contentWayPoint = function () {
    if (!$.fn.waypoint) return;

    $(".ftco-animate").each(function () {
      var $this = $(this);
      if ($this.data("ftco-animated-init")) return;
      $this.data("ftco-animated-init", true);

      $this.waypoint(function (direction) {
        var el = $(this.element);
        if (direction === "down" && !el.hasClass("ftco-animated")) {
          setTimeout(function () {
            el.addClass("item-animate");
            $("body .ftco-animate.item-animate").each(function (k) {
              var $el = $(this);
              setTimeout(function () {
                var effect = $el.data("animate-effect");
                if (effect === "fadeIn") $el.addClass("fadeIn ftco-animated");
                else if (effect === "fadeInLeft") $el.addClass("fadeInLeft ftco-animated");
                else if (effect === "fadeInRight") $el.addClass("fadeInRight ftco-animated");
                else $el.addClass("fadeInUp ftco-animated");
                $el.removeClass("item-animate");
              }, k * 50);
            });
          }, 100);
        }
      }, { offset: "95%" });
    });
  };
  contentWayPoint();

  // ---------- Image & iframe popup (guarded) ----------
  if ($.fn.magnificPopup) {
    if ($(".image-popup").length && !$(".image-popup").data("magnific-initialized")) {
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
        $(".image-popup").data("magnific-initialized", true);
      } catch (e) {}
    }

    if ($(".popup-youtube, .popup-vimeo, .popup-gmaps").length && !$(".popup-youtube").data("magnific-iframes")) {
      try {
        $(".popup-youtube, .popup-vimeo, .popup-gmaps").magnificPopup({
          disableOn: 700,
          type: "iframe",
          mainClass: "mfp-fade",
          removalDelay: 160,
          preloader: false,
          fixedContentPos: false,
        });
        $(".popup-youtube, .popup-vimeo, .popup-gmaps").data("magnific-iframes", true);
      } catch (e) {}
    }
  }

  // ---------- Disable bootstrap scrollspy on touch to avoid auto jumps ----------
  try {
    if (isTouch) {
      $("body").removeAttr("data-spy");
      if ($.fn.scrollspy) {
        try { $("body").scrollspy("dispose"); } catch (e) { $("body").removeData("bs.scrollspy"); }
      }
    } else {
      if ($.fn.scrollspy && !$("body").data("bs.scrollspy")) {
        try { $("body").scrollspy({ target: ".site-navbar-target", offset: 300 }); } catch (e) {}
      }
    }
  } catch (e) {}

})(jQuery);


/* ---------- Strong guard: block programmatic jumps & hash auto-jump ---------- */
(function () {
  "use strict";

  // If your file already defines userInteracting, reuse it; otherwise create a local guard
  if (typeof window.__userInteracting === "undefined") {
    window.__userInteracting = false;
    (["touchstart","touchmove","wheel","keydown"]).forEach(function(ev){
      window.addEventListener(ev, function () {
        window.__userInteracting = true;
        clearTimeout(window.__userInteractingTimer);
        window.__userInteractingTimer = setTimeout(function () { window.__userInteracting = false; }, 250);
      }, { passive: true });
    });
  }

  // Helper to check interaction
  function isUserInteracting() {
    return !!window.__userInteracting;
  }

  // 1) Patch window.scrollTo
  try {
    var _origScrollTo = window.scrollTo.bind(window);
    window.scrollTo = function (x, y) {
      if (isUserInteracting()) {
        console.warn("Blocked window.scrollTo while user interacting.");
        return;
      }
      return _origScrollTo(x, y);
    };
  } catch (e) {
    // ignore if can't override
  }

  // 2) Patch Element.prototype.scrollIntoView
  try {
    var _origScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (arg) {
      if (isUserInteracting()) {
        console.warn("Blocked scrollIntoView on element:", this);
        return;
      }
      try { return _origScrollIntoView.call(this, arg); } catch (e) {}
    };
  } catch (e) {}

  // 3) Patch jQuery animate to ignore scrollTop/scrollLeft animations when user interacting
  try {
    if (window.jQuery && jQuery && jQuery.fn && !jQuery.fn.__patched_for_scroll_block) {
      jQuery.fn.__patched_for_scroll_block = true;
      var _origAnimate = jQuery.fn.animate;
      jQuery.fn.animate = function (props) {
        // detect attempts to animate scrollTop/scrollLeft on html/body or any element
        try {
          var isScrollingAnim = props && (props.scrollTop !== undefined || props.scrollLeft !== undefined);
          if (isScrollingAnim && isUserInteracting()) {
            console.warn("Blocked jQuery animate scroll while user interacting.", props);
            return this; // no-op chainable
          }
        } catch (e) {}
        return _origAnimate.apply(this, arguments);
      };
    }
  } catch (e) {}

  // 4) Clear hash if some script sets it — remove :target jumps
  try {
    window.addEventListener("hashchange", function (ev) {
      if (history && history.replaceState) {
        try {
          history.replaceState(null, "", window.location.pathname + window.location.search);
          console.warn("Cleared location.hash to prevent auto-jump.");
        } catch (e) {}
      }
    }, { passive: true });
  } catch (e) {}

  // 5) Extra: observe DOM for unexpected focus changes that might scroll
  try {
    var focusObserver = new MutationObserver(function () {
      // if some node gets autofocus attribute injected, remove it
      var af = document.querySelector("[autofocus]");
      if (af && isUserInteracting()) {
        try { af.removeAttribute("autofocus"); console.warn("Removed injected autofocus during interaction."); } catch (e) {}
      }
    });
    focusObserver.observe(document.documentElement || document.body, { attributes: true, subtree: true, attributeFilter: ["autofocus"] });
  } catch (e) {}

})();

