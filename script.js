// script.js — Full interactive site script for Semiliguda.Inn
document.addEventListener("DOMContentLoaded", function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) =>
    Array.from((ctx || document).querySelectorAll(sel));

  /* ====================================================
     Smooth Scroll — "home" jumps to top, others scrollIntoView
  ==================================================== */
  window.scrollToSection = function (id) {
    if (!id) return;
    if (id === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ====================================================
     Mobile navigation toggle
  ==================================================== */
  (function navToggle() {
    const menuToggle = $(".menu-toggle");
    const navLinks = $(".nav-links");
    if (!menuToggle || !navLinks) return;

    menuToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(open));
    });

    // Close mobile menu after clicking a link
    $$(".nav-links .btn", navLinks).forEach((btn) =>
      btn.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      })
    );
  })();

  /* ====================================================
     HERO SLIDER (auto, manual, swipe, keyboard, pause on hover)
  ==================================================== */
  (function heroSlider() {
    const slider = $(".hero-slider");
    if (!slider) return;
    const slides = $$(".slide", slider);
    if (!slides.length) return;

    const nextBtn = slider.querySelector(".slider-btn.next");
    const prevBtn = slider.querySelector(".slider-btn.prev");

    let current = 0;
    const INTERVAL = 5000;
    let timer = null;
    let paused = false;

    function show(i) {
      current = (i + slides.length) % slides.length;
      slides.forEach((s, idx) => {
        s.classList.toggle("active", idx === current);
        s.setAttribute("aria-hidden", idx === current ? "false" : "true");
      });
    }

    function next() {
      show(current + 1);
    }
    function prev() {
      show(current - 1);
    }

    if (nextBtn)
      nextBtn.addEventListener("click", () => {
        next();
        restart();
      });
    if (prevBtn)
      prevBtn.addEventListener("click", () => {
        prev();
        restart();
      });

    slider.addEventListener("mouseenter", () => (paused = true));
    slider.addEventListener("mouseleave", () => (paused = false));
    slider.addEventListener("focusin", () => (paused = true));
    slider.addEventListener("focusout", () => (paused = false));

    // Touch swipe
    (function touch() {
      let startX = 0,
        deltaX = 0;
      slider.addEventListener(
        "touchstart",
        (e) => {
          if (e.touches && e.touches[0]) startX = e.touches[0].clientX;
        },
        { passive: true }
      );
      slider.addEventListener(
        "touchmove",
        (e) => {
          if (e.touches && e.touches[0]) deltaX = e.touches[0].clientX - startX;
        },
        { passive: true }
      );
      slider.addEventListener(
        "touchend",
        () => {
          if (deltaX > 40) {
            prev();
            restart();
          } else if (deltaX < -40) {
            next();
            restart();
          }
          startX = 0;
          deltaX = 0;
        },
        { passive: true }
      );
    })();

    // Keyboard support
    slider.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        prev();
        restart();
      }
      if (e.key === "ArrowRight") {
        next();
        restart();
      }
    });

    function start() {
      stop();
      timer = setInterval(() => {
        if (!paused) next();
      }, INTERVAL);
    }
    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }
    function restart() {
      paused = false;
      start();
    }

    show(0);
    start();
  })();

  /* ====================================================
     ROOM CAROUSEL (groups/dots/responsive/auto/manual)
     - groups of visible slides based on viewport (1..4)
     - dots represent groups
  ==================================================== */
  (function roomCarousel() {
    const slider = $(".room-slider");
    if (!slider) return;
    const track = $(".room-track", slider);
    const slides = $$(".card", slider);
    const btnNext = $(".room-btn.next", slider);
    const btnPrev = $(".room-btn.prev", slider);
    const dotsContainer = $(".room-dots", slider);

    if (!track || slides.length === 0) return;

    function visibleCount() {
      const w = window.innerWidth;
      if (w <= 500) return 1;
      if (w <= 768) return 2;
      if (w <= 1024) return 3;
      return 4;
    }

    function groupCount(vc = visibleCount()) {
      return Math.max(1, Math.ceil(slides.length / vc));
    }

    // Create/update dots
    function renderDots() {
      if (!dotsContainer) return;
      const vc = visibleCount();
      const groups = groupCount(vc);
      dotsContainer.innerHTML = "";
      for (let i = 0; i < groups; i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", `Go to group ${i + 1}`);
        b.addEventListener("click", () => {
          state.groupIndex = i;
          update();
          restartAuto();
        });
        dotsContainer.appendChild(b);
      }
    }

    // state
    const state = {
      groupIndex: 0,
      autoTimer: null,
      AUTO_MS: 4000,
    };

    // update transform and dot active
    function update() {
      const vc = visibleCount();
      const gap = parseFloat(getComputedStyle(track).gap) || 16;
      const slideWidth = slides[0].getBoundingClientRect().width + gap;
      const groups = groupCount(vc);
      if (state.groupIndex >= groups) state.groupIndex = 0;
      if (state.groupIndex < 0) state.groupIndex = groups - 1;
      const offset = state.groupIndex * vc * slideWidth;
      track.style.transform = `translateX(-${offset}px)`;
      // highlight correct dot
      if (dotsContainer) {
        const dots = Array.from(dotsContainer.children);
        dots.forEach((d, i) =>
          d.classList.toggle("active", i === state.groupIndex)
        );
      }
    }

    function nextGroup() {
      state.groupIndex = (state.groupIndex + 1) % groupCount();
      update();
    }
    function prevGroup() {
      state.groupIndex = (state.groupIndex - 1 + groupCount()) % groupCount();
      update();
    }

    if (btnNext)
      btnNext.addEventListener("click", () => {
        nextGroup();
        restartAuto();
      });
    if (btnPrev)
      btnPrev.addEventListener("click", () => {
        prevGroup();
        restartAuto();
      });

    // pause auto while hovering the whole slider
    slider.addEventListener("mouseenter", stopAuto);
    slider.addEventListener("mouseleave", startAuto);

    // auto
    function startAuto() {
      stopAuto();
      state.autoTimer = setInterval(() => nextGroup(), state.AUTO_MS);
    }
    function stopAuto() {
      if (state.autoTimer) {
        clearInterval(state.autoTimer);
        state.autoTimer = null;
      }
    }
    function restartAuto() {
      stopAuto();
      startAuto();
    }

    // Recompute on resize (debounced)
    let rtid = null;
    function onResize() {
      clearTimeout(rtid);
      rtid = setTimeout(() => {
        renderDots();
        update();
      }, 120);
    }
    window.addEventListener("resize", onResize);

    // init
    renderDots();
    // reveal observer will add .in-view to cards; ensure at least layout computed
    setTimeout(() => update(), 50);
    startAuto();
  })();

  /* ====================================================
     CARD MINI-SLIDERS — each .card-slider cycles internal images
     - pauses on hover / focus
  ==================================================== */
  (function cardSliders() {
    const sliders = document.querySelectorAll(".card-slider");
    if (!sliders || sliders.length === 0) return;

    sliders.forEach((slider) => {
      const imgs = Array.from(slider.querySelectorAll("img"));
      if (imgs.length <= 1) {
        // if only one image, make it visible
        if (imgs[0]) imgs[0].classList.add("active");
        return;
      }
      let i = 0;
      let interval = null;
      const INTERVAL = 3000;
      imgs.forEach((img, idx) => img.classList.toggle("active", idx === 0));

      function start() {
        stop();
        interval = setInterval(() => {
          imgs[i].classList.remove("active");
          i = (i + 1) % imgs.length;
          imgs[i].classList.add("active");
        }, INTERVAL);
      }
      function stop() {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      }

      // pause on hover & focus
      slider.addEventListener("mouseenter", stop);
      slider.addEventListener("mouseleave", start);
      slider.addEventListener("focusin", stop);
      slider.addEventListener("focusout", start);

      start();
    });
  })();

  /* ====================================================
     BOOKING FORM — popup choice (WhatsApp or Email)
  ==================================================== */
  (function bookingHandler() {
    const form = document.getElementById("bookingForm");
    const status = document.getElementById("bookingStatus");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const get = (id) => (document.getElementById(id)?.value || "").trim();
      const name = get("name");
      const phone = get("phone");
      const email = get("email");
      const guests = get("guests") || "1";
      const checkin = get("checkin");
      const checkout = get("checkout");
      const message = get("message");

      if (!name || !phone || !checkin || !checkout) {
        status.textContent = "⚠️ Please fill all required fields.";
        status.style.color = "#b45309";
        return;
      }

      const msg = [
        "📋 Semiliguda.Inn Booking Request",
        "--------------------------",
        `👤 Name: ${name}`,
        `📞 Phone: ${phone}`,
        `📧 Email: ${email || "N/A"}`,
        `👥 Guests: ${guests}`,
        `🏨 Check-in: ${checkin}`,
        `🏡 Check-out: ${checkout}`,
        `📝 Message: ${message || "None"}`,
        "--------------------------",
        "Thank you for choosing Semiliguda.Inn!",
      ].join("\n");

      showSendOptionPopup(msg);
    });

    function showSendOptionPopup(message) {
      let popup = document.getElementById("send-option-popup");
      if (!popup) {
        popup = document.createElement("div");
        popup.id = "send-option-popup";
        popup.innerHTML = `
          <div class="popup-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:2200"></div>
          <div class="popup-card" role="dialog" aria-modal="true" style="position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;padding:18px;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.25);max-width:360px;width:92%;z-index:2300;text-align:center;">
            <h3 style="margin:0 0 8px;color:var(--accent,#0f766e)">Send Booking Request</h3>
            <p style="margin:0 0 12px;color:#374151">Choose where to send your booking details</p>
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
              <button id="sendWhatsapp" class="btn primary" style="min-width:120px">📱 WhatsApp</button>
              <button id="sendEmail" class="btn" style="min-width:120px">📧 Email</button>
            </div>
            <button id="popupClose" aria-label="Close" style="position:absolute;right:10px;top:8px;background:none;border:none;font-size:18px;cursor:pointer;">✖</button>
          </div>`;
        document.body.appendChild(popup);
      }

      popup.style.display = "block";
      const overlay = popup.querySelector(".popup-overlay");
      const close = popup.querySelector("#popupClose");
      const waBtn = popup.querySelector("#sendWhatsapp");
      const emBtn = popup.querySelector("#sendEmail");

      const closePopup = () => (popup.style.display = "none");
      overlay.onclick = closePopup;
      close.onclick = closePopup;

      waBtn.onclick = () => {
        sendViaWhatsApp(message);
        closePopup();
        if (status) {
          status.textContent = "WhatsApp opened.";
          status.style.color = "";
        }
      };
      emBtn.onclick = () => {
        sendViaEmail(message);
        closePopup();
        if (status) {
          status.textContent = "Opening email client...";
          status.style.color = "";
        }
      };
    }

    function sendViaWhatsApp(msg) {
      const number = "917077574333"; // ensure country code included
      const url = `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
      try {
        const w = window.open(url, "_blank");
        if (w) w.focus();
        else window.location.href = url;
      } catch (e) {
        window.location.href = url;
      }
    }

    function sendViaEmail(msg) {
      const subject = encodeURIComponent("Booking Request — Semiliguda.Inn");
      const body = encodeURIComponent(
        msg.replace(/📋|--------------------------/g, "")
      );
      window.location.href = `mailto:semiligudainn@gmail.com?subject=${subject}&body=${body}`;
    }
  })();

  /* ====================================================
     Scroll reveal: add .in-view when cards appear
  ==================================================== */
  (function reveal() {
    const cards = $$(".card");
    if (!cards.length) return;
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      cards.forEach((c) => io.observe(c));
    } else {
      cards.forEach((c) => c.classList.add("in-view"));
    }
  })();

  /* ====================================================
     Lazy-load: ensure <img loading="lazy"> on images
  ==================================================== */
  (function lazyLoad() {
    $$("img").forEach((img) => {
      if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
    });
  })();

  /* ====================================================
     Keyboard accessibility for nav buttons
  ==================================================== */
  document.querySelectorAll(".nav-links .btn").forEach((btn) => {
    btn.setAttribute("tabindex", "0");
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        btn.click();
      }
    });
  });
});
