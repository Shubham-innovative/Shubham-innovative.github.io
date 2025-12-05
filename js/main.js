// main.js - guarded & defensive version for preventing duplicate initialization / duplicate profile

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

  // Helper: ensure only one .profile (or custom selector) exists
  function ensureSingleProfile(selector) {
    try {
      const nodes = document.querySelectorAll(selector);
      if (nodes.length > 1) {
        // keep the first, remove the rest
        for (let i = 1; i < nodes.length; i++) nodes[i].remove();
        console.warn("Removed duplicate profile elements, kept first.");
      }
    } catch (e) {
      // selector may not exist or may be invalid; ignore
    }
  }

  // Mutation observer to help detect runtime additions of profile nodes (optional; helpful while debugging)
  (function watchForProfileAdds() {
    try {
      const parent = document.body;
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (const node of m.addedNodes) {
            if (node.nodeType === 1) {
              if (node.matches && (node.matches(".profile") || node.querySelector && node.querySelector(".profile"))) {
                console.trace("Profile node added to DOM:", node);
                // ensure single instance immediately when one is added
                ensureSingleProfile(".profile");
              }
            }
          }
        }
      });
      observer.observe(parent, { childList: true, subtree: true });
    } catch (e) {
      // ignore observer errors in older browsers
    }
  })();

  // Initialize AOS safely
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 800,
      easing: "slide",
    });
  }

  (function ($) {
    "use strict";

    // Parallax (Stellar.js) - check plugin exists
    if ($.fn.stellar) {
      $(window).stellar({
        responsive: true,
        parallaxBackgrounds: true,
        parallaxElements: true,
        horizontalScrolling: false,
        hideDistantElements: false,
        scrollProperty: "scroll",
      });
    }

    // Full height sections
    var fullHeight = function () {
      var setHeight = function () {
        $(".js-fullheight").css("height", $(window).height());
      };

      setHeight();
      $(window).resize(setHeight);
    };
    fullHeight();

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

    // Scrollax init (if available)
    if (typeof $.Scrollax !== "undefined") {
      $.Scrollax();
    }

    // Burger Menu
    var burgerMenu = function () {
      $("body").on("click", ".js-fh5co-nav-toggle", function (event) {
        event.preventDefault();
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

        $("html, body").animate(
          {
            scrollTop: target.offset().top - 70,
          },
          500
        );
      });
    };
    onePageClick();

    // Hero / home carousel
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

    // Navbar dropdown hover
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

    // Navbar scroll behavior (debounced)
    var scrollWindow = function () {
      var $w = $(window),
        st = $w.scrollTop(),
        navbar = $(".ftco_navbar"),
        sd = $(".js-scroll-wrap");

      if (st > 150) {
        if (!navbar.hasClass("scrolled")) {
          navbar.addClass("scrolled");
        }
      }
      if (st < 150) {
        if (navbar.hasClass("scrolled")) {
          navbar.removeClass("scrolled sleep");
        }
      }
      if (st > 350) {
        if (!navbar.hasClass("awake")) {
          navbar.addClass("awake");
        }

        if (sd.length > 0) {
          sd.addClass("sleep");
        }
      }
      if (st < 350) {
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

    // Counter animation
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
        { offset: "95%" }
      );
    };
    counter();

    // Content animations
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
        { offset: "95%" }
      );
    };
    contentWayPoint();

    // Image popup
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

      // If you use a sticky profile variant, call toggle once to set correct visibility on load
      // Example: toggleStickyProfile function (uncomment & adapt if you have .profile--sticky)
      // toggleStickyProfile();
    });

    // Also run on load event to be extra safe
    $(window).on("load", function () {
      ensureSingleProfile(".profile");
    });
  })(jQuery);
}


