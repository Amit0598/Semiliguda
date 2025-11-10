// js/script.js - hero slider, room carousel, booking popup (WA/email), nav toggle, reveal, lazyload
document.addEventListener("DOMContentLoaded", function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) =>
    Array.from((ctx || document).querySelectorAll(sel));

  /* ========================================
     Smooth Scroll — "home" goes to page top
  ======================================== */
  window.scrollToSection = function (id) {
    if (!id) return;

    // Special case for "home" to scroll to top
    if (id === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ========================================
     Mobile Navigation Toggle
  ======================================== */
  (function navToggle() {
    const menuToggle = $(".menu-toggle");
    const navLinks = $(".nav-links");
    if (!menuToggle || !navLinks) return;

    menuToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(open));
    });

    $$(".nav-links .btn", navLinks).forEach((b) =>
      b.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      })
    );
  })();

  /* ========================================
     HERO SLIDER (Auto, Touch, Keyboard)
  ======================================== */
  (function heroSlider() {
    const slider = $(".hero-slider");
    if (!slider) return;
    const slides = $$(".slide", slider);
    if (!slides.length) return;

    let next = slider.querySelector(".slider-btn.next");
    let prev = slider.querySelector(".slider-btn.prev");

    // Create buttons if not found
    if (!next) {
      next = document.createElement("button");
      next.className = "slider-btn next";
      next.innerText = "❯";
      next.setAttribute("aria-label", "Next slide");
      slider.appendChild(next);
    }
    if (!prev) {
      prev = document.createElement("button");
      prev.className = "slider-btn prev";
      prev.innerText = "❮";
      prev.setAttribute("aria-label", "Previous slide");
      slider.appendChild(prev);
    }

    let index = 0;
    const INTERVAL = 5000;
    let timer = null;
    let paused = false;

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, idx) => {
        s.classList.toggle("active", idx === index);
        s.setAttribute("aria-hidden", idx === index ? "false" : "true");
      });
    }

    function nextSlide() {
      show(index + 1);
    }
    function prevSlide() {
      show(index - 1);
    }

    next.addEventListener("click", () => {
      nextSlide();
      restart();
    });
    prev.addEventListener("click", () => {
      prevSlide();
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
            prevSlide();
            restart();
          } else if (deltaX < -40) {
            nextSlide();
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
        prevSlide();
        restart();
      }
      if (e.key === "ArrowRight") {
        nextSlide();
        restart();
      }
    });

    function start() {
      stop();
      timer = setInterval(() => {
        if (!paused) nextSlide();
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

  /* ========================================
     ROOM CAROUSEL (Auto + Manual)
  ======================================== */
  (function roomCarousel() {
    const slider = document.querySelector(".room-slider");
    if (!slider) return;
    const track = slider.querySelector(".room-track");
    const slides = slider.querySelectorAll(".room-track .card");
    const btnNext = slider.querySelector(".room-btn.next");
    const btnPrev = slider.querySelector(".room-btn.prev");
    if (!track || !slides.length || !btnNext || !btnPrev) return;

    let index = 0;
    let autoTimer = null;
    const AUTO_MS = 4000;

    function visibleCount() {
      const w = window.innerWidth;
      if (w <= 500) return 1;
      if (w <= 768) return 2;
      if (w <= 1024) return 3;
      return 4;
    }

    function update() {
      const gap = parseFloat(getComputedStyle(track).gap) || 16;
      const slideWidth = slides[0].getBoundingClientRect().width + gap;
      const maxIndex = Math.max(0, slides.length - visibleCount());
      if (index > maxIndex) index = 0;
      if (index < 0) index = maxIndex;
      track.style.transform = `translateX(-${index * slideWidth}px)`;
    }

    function next() {
      index = (index + 1) % slides.length;
      update();
    }
    function prev() {
      index = (index - 1 + slides.length) % slides.length;
      update();
    }

    btnNext.addEventListener("click", () => {
      next();
      restartAuto();
    });
    btnPrev.addEventListener("click", () => {
      prev();
      restartAuto();
    });

    // Auto-scroll
    function startAuto() {
      stopAuto();
      autoTimer = setInterval(() => {
        const maxIndex = Math.max(0, slides.length - visibleCount());
        index = index < maxIndex ? index + 1 : 0;
        update();
      }, AUTO_MS);
    }
    function stopAuto() {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
    }
    function restartAuto() {
      stopAuto();
      startAuto();
    }

    window.addEventListener("resize", update);
    update();
    startAuto();
  })();

  /* ========================================
     BOOKING POPUP (WhatsApp / Email)
  ======================================== */
  (function bookingHandler() {
    const form = document.getElementById("bookingForm");
    const status = document.getElementById("bookingStatus");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const get = (id) => (document.getElementById(id)?.value || "").trim();
      const name = get("name"),
        phone = get("phone"),
        email = get("email"),
        guests = get("guests") || "1",
        checkin = get("checkin"),
        checkout = get("checkout"),
        message = get("message");

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
              <button id="sendWhatsapp" class="btn primary" style="min-width:120px;padding:8px 12px">📱 WhatsApp</button>
              <button id="sendEmail" class="btn" style="min-width:120px;padding:8px 12px">📧 Email</button>
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

      function closePopup() {
        popup.style.display = "none";
      }

      overlay.onclick = closePopup;
      close.onclick = closePopup;

      waBtn.onclick = () => {
        sendViaWhatsApp(message);
        closePopup();
        status.textContent = "WhatsApp opened.";
      };
      emBtn.onclick = () => {
        sendViaEmail(message);
        closePopup();
        status.textContent = "Opening email client...";
      };
    }

    function sendViaWhatsApp(msg) {
      const number = "917077574333";
      const url = `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank");
    }
    function sendViaEmail(msg) {
      const subject = encodeURIComponent("Booking Request — Semiliguda.Inn");
      const body = encodeURIComponent(
        msg.replace(/📋|--------------------------/g, "")
      );
      window.location.href = `mailto:semiligudainn@gmail.com?subject=${subject}&body=${body}`;
    }
  })();

  /* ========================================
     Scroll Reveal for Cards
  ======================================== */
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

  /* ========================================
     Lazy Load Images
  ======================================== */
  (function lazyImgs() {
    $$("img").forEach((img) => {
      if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
    });
  })();

  /* ========================================
     Keyboard Nav Support
  ======================================== */
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
