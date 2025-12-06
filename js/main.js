// safe-portfolio-init.js
// Drop-in replacement for your previous script

// Initialize AOS safely (only once)
if (typeof AOS !== "undefined" && !AOS.__initialized) {
  AOS.init({
    duration: 800,
    easing: "slide",
    once: true, // animate once for performance
    mirror: false
  });
  AOS.__initialized = true;
}

(function ($) {
  "use strict";

  // Utility: detect touch / mobile
  var isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

  // ---------- Parallax (Stellar.js) - only if available and not on touch devices ----------
  if ($.fn.stellar && !isTouch) {
    if (!$(window).data("stellar-initialized")) {
      $(window).stellar({
        responsive: true,
        parallaxBackgrounds: true,
        parallaxElements: true,
        horizontalScrolling: false,
        hideDistantElements: false,
        scrollProperty: "scroll",
      });
      $(window).data("stellar-initialized", true);
    }
  } else {
    // If on touch or not available, ensure any parallax classes don't break layout
    $(".parallax-section").removeClass("parallax-section");
  }

  // ---------- Full height sections ----------
  // Prefer CSS min-height:100vh for most cases; keep a safe JS fallback and debounce it
  var fullHeight = function () {
    var resizeTimer;
    var setHeight = function () {
      $(".js-fullheight").each(function () {
        // use innerHeight to be slightly more stable on mobile browsers
        $(this).css("height", window.innerHeight + "px");
      });
    };

    $(window).on("resize orientationchange", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        setHeight();
      }, 150);
    });

    // initial call
    try {
      setHeight();
    } catch (e) {
      // fail silently
    }
  };
  fullHeight();

  // ---------- Loader ----------
  var loader = function () {
    // tiny delay is fine — don't use 0 to avoid race conditions
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
    } catch (e) {
      // ignore
    }
  }

  // ---------- Burger Menu ----------
  var burgerMenu = function () {
    // toggle active on the button and toggle nav visibility (for accessibility + mobile)
    $("body").on("click", ".js-fh5co-nav-toggle", function (event) {
      event && event.preventDefault();
      var $this = $(this);
      $this.toggleClass("active");

      // toggle nav panel — you may replace with your existing show/hide logic
      var $nav = $("#ftco-nav");
      if ($nav.length) {
        $nav.toggleClass("visible");
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

  // ---------- Smooth scrolling for nav links ----------
  var onePageClick = function () {
    $(document).on("click", '#ftco-nav a[href^="#"]', function (event) {
      event && event.preventDefault();

      var href = $.attr(this, "href");
      var target = $(href);
      if (!target.length) return;

      // animate with requestAnimationFrame-friendly approach
      $("html, body").animate(
        {
          scrollTop: Math.max(target.offset().top - 70, 0),
        },
        500,
        function () {}
      );
    });
  };
  onePageClick();

  // ---------- Hero / home carousel (guard re-init) ----------
  var carousel = function () {
    if ($.fn.owlCarousel && !$(".home-slider").data("owl-initialized")) {
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
        navText: [
          "<span class='ion-md-arrow-back'></span>",
          "<span class='ion-chevron-right'></span>",
        ],
        responsive: {
          0: { items: 1 },
          600: { items: 1 },
          1000: { items: 1 },
        },
        onInitialized: function () {
          $(".home-slider").data("owl-initialized", true);
        },
      });
    }
  };
  carousel();

  // ---------- Navbar dropdown hover ----------
  // keep this but ensure hover only on non-touch devices
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
    // on touch devices rely on click events (avoid hover toggles)
    $("nav .dropdown > a").on("click", function (e) {
      var $parent = $(this).closest(".dropdown");
      $parent.toggleClass("show");
      $parent.find(".dropdown-menu").toggleClass("show");
      e.preventDefault();
    });
  }

  $("#dropdown04").on("show.bs.dropdown", function () {
    // keep for debug if needed
    // console.log("show");
  });

  // ---------- Throttled scroll handler for navbar behavior ----------
  var scrollWindow = (function () {
    var lastKnownScrollY = 0;
    var ticking = false;

    function onScroll() {
      lastKnownScrollY = window.scrollY;
      requestTick();
    }

    function requestTick() {
      if (!ticking) {
        requestAnimationFrame(update);
      }
      ticking = true;
    }

    function update() {
      var st = lastKnownScrollY;
      var navbar = $(".ftco_navbar");
      var sd = $(".js-scroll-wrap");

      if (st > 150) {
        navbar.addClass("scrolled");
      } else {
        navbar.removeClass("scrolled sleep");
      }

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

    $("#section-counter, .hero-wrap, .ftco-counter, .ftco-about").waypoint(
      function (direction) {
        var $el = $(this.element);
        if (direction === "down" && !$el.hasClass("ftco-animated")) {
          $el.addClass("ftco-animated");
          var commaStep = $.animateNumber.numberStepFactories.separator(",");
          $el.find(".number").each(function () {
            var $this = $(this),
              num = $this.data("number") || 0;
            $this.animateNumber(
              {
                number: num,
                numberStep: commaStep,
              },
              7000
            );
          });
        }
      },
      { offset: "95%" }
    );
  };
  counter();

  // ---------- Content animations (waypoint) with single-init guard ----------
  var contentWayPoint = function () {
    if (!$.fn.waypoint) return;

    $(".ftco-animate").each(function () {
      var $this = $(this);
      if ($this.data("ftco-animated-init")) return; // already bound
      $this.data("ftco-animated-init", true);

      $this.waypoint(
        function (direction) {
          var el = $(this.element);
          if (direction === "down" && !el.hasClass("ftco-animated")) {
            setTimeout(function () {
              el.addClass("item-animate");
              $("body .ftco-animate.item-animate").each(function (k) {
                var $el = $(this);
                setTimeout(function () {
                  var effect = $el.data("animate-effect");
                  if (effect === "fadeIn") {
                    $el.addClass("fadeIn ftco-animated");
                  } else if (effect === "fadeInLeft") {
                    $el.addClass("fadeInLeft ftco-animated");
                  } else if (effect === "fadeInRight") {
                    $el.addClass("fadeInRight ftco-animated");
                  } else {
                    $el.addClass("fadeInUp ftco-animated");
                  }
                  $el.removeClass("item-animate");
                }, k * 50);
              });
            }, 100);
          }
        },
        { offset: "95%" }
      );
    });
  };
  contentWayPoint();

  // ---------- Image & iframe popup ----------
  if ($.fn.magnificPopup) {
    if ($(".image-popup").length && !$(".image-popup").data("magnific-initialized")) {
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
    }

    if ($(".popup-youtube, .popup-vimeo, .popup-gmaps").length && !$(".popup-youtube").data("magnific-iframes")) {
      $(".popup-youtube, .popup-vimeo, .popup-gmaps").magnificPopup({
        disableOn: 700,
        type: "iframe",
        mainClass: "mfp-fade",
        removalDelay: 160,
        preloader: false,
        fixedContentPos: false,
      });
      $(".popup-youtube, .popup-vimeo, .popup-gmaps").data("magnific-iframes", true);
    }
  }
})(jQuery);
// --- Mobile scroll-jump fixes: disable scrollspy on touch, block programmatic scroll during user interaction, remove hash ---
(function ($) {
  "use strict";

  var isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

  // If touch device, disable Bootstrap ScrollSpy if present
  try {
    if (isTouch) {
      // Remove data-spy attribute if present to avoid bootstrap auto behavior
      $("body").removeAttr("data-spy");
      // If ScrollSpy has already been initialized, dispose it (Bootstrap 4)
      if ($.fn.scrollspy) {
        try {
          // try dispose if available
          $('body').scrollspy('dispose');
        } catch (e) {
          // fallback: remove any stored scrollspy data
          $('body').removeData('bs.scrollspy');
        }
      }
    } else {
      // For non-touch devices, ensure scrollspy is initialized once (optional)
      if ($.fn.scrollspy && !$('body').data('bs.scrollspy')) {
        $('body').scrollspy({ target: '.site-navbar-target', offset: 300 });
      }
    }
  } catch (e) {
    // ignore errors
  }

  // Track user interaction to avoid programmatic scroll overriding user scroll
  var userInteracting = false;
  var interactionTimer = null;
  function markInteracting() {
    userInteracting = true;
    clearTimeout(interactionTimer);
    interactionTimer = setTimeout(function () {
      userInteracting = false;
    }, 250);
  }

  ['touchstart', 'touchmove', 'wheel'].forEach(function (ev) {
    window.addEventListener(ev, markInteracting, { passive: true });
  });

  // Safe scroll function: won't run if user interacting
  function safeScrollTo(y, duration) {
    if (userInteracting) return false;
    // stop any in-progress animations
    $("html, body").stop(true);
    $("html, body").animate({ scrollTop: y }, duration || 500);
    return true;
  }

  // Replace your nav click handler (or add on top of it) to use safeScrollTo + remove hash
  $(document).off("click", '#ftco-nav a[href^="#"]');
  $(document).on("click", '#ftco-nav a[href^="#"]', function (e) {
    e && e.preventDefault();
    var href = $.attr(this, "href");
    if (!href || href === "#") return;
    var $target = $(href);
    if (!$target.length) return;

    var targetY = Math.max($target.offset().top - 70, 0);
    var didScroll = safeScrollTo(targetY, 500);

    // If we successfully scrolled programmatically, remove the hash so browser won't auto-jump later
    if (didScroll && history && history.replaceState) {
      try {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      } catch (err) { /* ignore */ }
    } else {
      // If we did not do programmatic scroll (user interacting), let the browser handle native scroll
      // but still remove hash after a short delay to avoid later jumps
      setTimeout(function () {
        if (history && history.replaceState) {
          try { history.replaceState(null, "", window.location.pathname + window.location.search); } catch (err) {}
        }
      }, 1000);
    }

    // close bootstrap collapse (mobile) if open
    var $navCollapse = $("#ftco-nav.collapse");
    if ($navCollapse.length && $navCollapse.hasClass("show")) {
      try { $navCollapse.collapse('hide'); } catch (err) { $navCollapse.removeClass('show'); }
      $(".js-fh5co-nav-toggle").removeClass("active");
    }
  });

  // Remove any existing URL hash on page load (best-effort) to prevent :target jumps
  $(function () {
    if (window.location.hash) {
      var id = window.location.hash.replace('#','');
      if (document.getElementById(id) && history && history.replaceState) {
        try { history.replaceState(null, "", window.location.pathname + window.location.search); } catch (err) {}
      }
    }
  });

  // Stop any running scroll animations if the user interacts (prevents auto-snap)
  ['touchstart', 'touchmove', 'wheel', 'keydown'].forEach(function(ev) {
    window.addEventListener(ev, function () { $("html, body").stop(true, true); }, { passive: true });
  });

})(jQuery);







