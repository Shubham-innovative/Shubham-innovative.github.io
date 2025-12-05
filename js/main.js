// main.js - mobile-aware guarded & defensive version

// Prevent this file from running more than once (useful if script accidentally included twice)
if (window.__ftco_main_initialized) {
  console.warn("ftco main already initialized — skipping duplicate init");
} else {
  window.__ftco_main_initialized = true;

  // Utility: debounce
  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // Detect touch / mobile
  function isTouchDevice() {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }
  function isSmallScreen() {
    return window.innerWidth <= 768; // adjust breakpoint as needed
  }

  // Helper: ensure only one .profile (or custom selector) exists
  function ensureSingleProfile(selector) {
    try {
      const nodes = document.querySelectorAll(selector);
      if (nodes.length > 1) {
        for (let i = 1; i < nodes.length; i++) nodes[i].remove();
        console.warn("Removed duplicate profile elements, kept first.");
      }
    } catch (e) {}
  }

  // Re-run some safeties on orientation/resize
  function safeReflow() {
    // ensure single profile (fix duplicates appearing on orientation)
    ensureSingleProfile(".profile");

    // Recompute fullHeight for mobile/desktop switch
    applyFullHeightBehavior();
  }

  // Mutation observer to detect runtime additions of profile nodes (helpful while debugging)
  (function watchForProfileAdds() {
    try {
      const parent = document.body;
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (const node of m.addedNodes) {
            if (node.nodeType === 1) {
              if (
                node.matches &&
                (node.matches(".profile") ||
                  node.querySelector &&
                  node.querySelector(".profile"))
              ) {
                console.trace("Profile node added to DOM:", node);
                ensureSingleProfile(".profile");
              }
            }
          }
        }
      });
      observer.observe(parent, { childList: true, subtree: true });
    } catch (e) {}
  })();

  // Initialize AOS safely (disable on small screens for stability/performance)
  if (typeof AOS !== "undefined") {
    try {
      if (isSmallScreen()) {
        // optional: disable AOS on mobile to avoid animation duplication or layout jumps
        AOS.init({ disable: true });
      } else {
        AOS.init({
          duration: 800,
          easing: "slide",
        });
      }
    } catch (e) {}
  }

  (function ($) {
    "use strict";

    // Parallax (Stellar.js) - disable on touch devices because it often breaks layout on mobile
    if ($.fn.stellar && !isTouchDevice()) {
      $(window).stellar({
        responsive: true,
        parallaxBackgrounds: true,
        parallaxElements: true,
        horizontalScrolling: false,
        hideDistantElements: false,
        scrollProperty: "scroll",
      });
    }

    // Full height sections (mobile-friendly)
    var applyFullHeightBehavior = function () {
      // Use CSS-based approach on mobile: let content determine height to avoid vh issues
      if (isSmallScreen()) {
        $(".js-fullheight").css({
          height: "auto",
          "min-height": $(window).height() + "px", // optional: ensure min height but allow content overflow
        });
        // remove resize handler on mobile (we'll keep a light resize listener separately)
        return;
      }

      // Desktop behavior: set explicit height
      var setHeight = function () {
        $(".js-fullheight").css("height", $(window).height());
      };
      setHeight();
      // keep resize binding to adjust on desktop
      $(window).off("resize.ftco_fullheight").on("resize.ftco_fullheight", setHeight);
    };
    applyFullHeightBehavior();

    // lightweight resize/orientation handler to reapply mobile/desktop switch
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

    // Scrollax init (if available) - avoid heavy scroll libs on touch devices
    if (typeof $.Scrollax !== "undefined" && !isTouchDevice()) {
      try {
        $.Scrollax();
      } catch (e) {}
    }

    // Burger Menu (touch-friendly)
    var burgerMenu = function () {
      $("body").on("click touchstart", ".js-fh5co-nav-toggle", function (event) {
        // prevent double-firing on some mobile browsers
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

    // Smooth scrolling for nav links (works on mobile)
    var onePageClick = function () {
      $(document).on("click", '#ftco-nav a[href^="#"]', function (event) {
        event.preventDefault();

        var target = $($.attr(this, "href"));
        if (!target.length) return;

        // On mobile, use slightly longer duration for smoother feel
        var dur = isSmallScreen() ? 600 : 500;
        $("html, body").animate(
          {
            scrollTop: target.offset().top - 70,
          },
          dur
        );
      });
    };
    onePageClick();

    // Hero / home carousel (Owl handles responsiveness internally)
    var carousel = function () {
      if ($.fn.owlCarousel) {
        $(".home-slider").owlCarousel({
          loop: true,
          autoplay: true,
          margin: 0,
          animateOut: "fadeOut",
          animateIn: "fadeIn",
          nav: false,
          autoplayHoverPause: false,
          items: 1,
          navText: [
            "<span class='ion-md-arrow-back'></span>",
            "<span class='ion-chevron-right'></span>",
          ],
          responsive: {
            0: {
              items: 1,
            },
            600: {
              items: 1,
            },
            1000: {
              items: 1,
            },
          },
        });
      }
    };
    carousel();

    // Navbar dropdown hover -> on touch devices, hover doesn't exist; keep it but it won't trigger
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

    // Navbar scroll behavior (debounced). Use smaller thresholds for mobile.
    var scrollWindow = function () {
      var $w = $(window),
        st = $w.scrollTop(),
        navbar = $(".ftco_navbar"),
        sd = $(".js-scroll-wrap");

      // thresholds adapt to screen size
      var thresh1 = isSmallScreen() ? 80 : 150;
      var thresh2 = isSmallScreen() ? 160 : 350;

      if (st > thresh1) {
        if (!navbar.hasClass("scrolled")) {
          navbar.addClass("scrolled");
        }
      }
      if (st < thresh1) {
        if (navbar.hasClass("scrolled")) {
          navbar.removeClass("scrolled sleep");
        }
      }
      if (st > thresh2) {
        if (!navbar.hasClass("awake")) {
          navbar.addClass("awake");
        }
        if (sd.length > 0) {
          sd.addClass("sleep");
        }
      }
      if (st < thresh2) {
        if (navbar.hasClass("awake")) {
          navbar.removeClass("awake");
          navbar.addClass("sleep");
        }
        if (sd.length > 0) {
          sd.removeClass("sleep");
        }
      }
    };

    // Attach debounced scroll handler (50ms)
    $(window).on(
      "scroll",
      debounce(function () {
        scrollWindow();
      }, 50)
    );

    // Counter animation (waypoints) - waypoints may not fire consistently on mobile; use offset tweak
    var counter = function () {
      if (!$.fn.waypoint || !$.fn.animateNumber) return;

      $("#section-counter, .hero-wrap, .ftco-counter, .ftco-about").waypoint(
        function (direction) {
          if (
            direction === "down" &&
            !$(this.element).hasClass("ftco-animated")
          ) {
            var commaStep = $.animateNumber.numberStepFactories.separator(",");

            $(".number").each(function () {
              var $this = $(this),
                num = $this.data("number");
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
        { offset: isSmallScreen() ? "110%" : "95%" } // tweak offset for mobile
      );
    };
    counter();

    // Content animations (waypoints)
    var contentWayPoint = function () {
      if (!$.fn.waypoint) return;

      var i = 0;
      $(".ftco-animate").waypoint(
        function (direction) {
          if (
            direction === "down" &&
            !$(this.element).hasClass("ftco-animated")
          ) {
            i++;

            $(this.element).addClass("item-animate");
            setTimeout(function () {
              $("body .ftco-animate.item-animate").each(function (k) {
                var el = $(this);
                setTimeout(function () {
                  var effect = el.data("animate-effect");
                  if (effect === "fadeIn") {
                    el.addClass("fadeIn ftco-animated");
                  } else if (effect === "fadeInLeft") {
                    el.addClass("fadeInLeft ftco-animated");
                  } else if (effect === "fadeInRight") {
                    el.addClass("fadeInRight ftco-animated");
                  } else {
                    el.addClass("fadeInUp ftco-animated");
                  }
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

    // Image popup (magnificPopup) - fine on mobile but keep plugin's disableOn handled inside config
    if ($.fn.magnificPopup) {
      $(".image-popup").magnificPopup({
        type: "image",
        closeOnContentClick: true,
        closeBtnInside: false,
        fixedContentPos: true,
        mainClass: "mfp-no-margins mfp-with-zoom",
        gallery: {
          enabled: true,
          navigateByImgClick: true,
          preload: [0, 1],
        },
        image: {
          verticalFit: true,
        },
        zoom: {
          enabled: true,
          duration: 300,
        },
      });

      // Video / map popup
      $(".popup-youtube, .popup-vimeo, .popup-gmaps").magnificPopup({
        disableOn: 700,
        type: "iframe",
        mainClass: "mfp-fade",
        removalDelay: 160,
        preloader: false,
        fixedContentPos: false,
      });
    }

    // On load / DOM ready: ensure single profile and run initial toggles
    $(document).ready(function () {
      // replace '.profile' with your actual profile selector if different (e.g. '#profile' or '.user-profile')
      ensureSingleProfile(".profile");

      // initial scroll run to set navbar correctly
      scrollWindow();
    });

    // Also run on load event to be extra safe
    $(window).on("load", function () {
      ensureSingleProfile(".profile");
      applyFullHeightBehavior();
      scrollWindow();
    });
  })(jQuery);
}




