// Gordon Landscaping - Site JS

// Scroll reveal
const revealEls = document.querySelectorAll(".reveal");
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }
  },
  { threshold: 0.1, rootMargin: "0px 0px -20px 0px" }
);
revealEls.forEach((el) => io.observe(el));

// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = document.getElementById("nav-toggle");
const mobileNav = document.getElementById("mobile-nav");
const mobileNavOverlay = document.getElementById("mobile-nav-overlay");
const mobileNavLinks = document.querySelectorAll(".mobile-nav a[href]");

function openMobileNav() {
  mobileNav?.classList.add("open");
  mobileNavOverlay?.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeMobileNav() {
  mobileNav?.classList.remove("open");
  mobileNavOverlay?.classList.remove("open");
  document.body.style.overflow = "";
}

navToggle?.addEventListener("click", () => {
  mobileNav?.classList.contains("open") ? closeMobileNav() : openMobileNav();
});
mobileNavOverlay?.addEventListener("click", closeMobileNav);
mobileNavLinks?.forEach((link) => link.addEventListener("click", closeMobileNav));

// Lightbox for project gallery
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxClose = document.getElementById("lightbox-close");
const lightboxTriggers = document.querySelectorAll("[data-lightbox]");

function openLightbox(src, alt) {
  if (lightboxImg) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || "Project image";
  }
  lightbox?.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeLightbox() {
  lightbox?.classList.remove("open");
  document.body.style.overflow = "";
}

lightboxTriggers.forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    const img = el.querySelector("img") || el;
    const src = img.dataset?.full || img.src || el.href;
    const alt = img.alt || el.title || "Project";
    openLightbox(src, alt);
  });
});
lightboxClose?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && lightbox?.classList.contains("open")) closeLightbox();
});

// Animated counters
function animateCounter(el, target, duration = 1500) {
  const start = 0;
  const startTime = performance.now();
  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.floor(start + (target - start) * eased);
    el.textContent = value;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

const statObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      const num = e.target.querySelector(".stat-number");
      if (num && num.dataset.target && !num.dataset.animated) {
        num.dataset.animated = "true";
        animateCounter(num, +num.dataset.target);
      }
      statObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll(".stat-cell").forEach((el) => statObserver.observe(el));

// Before/After slider
const baSlider = document.querySelector(".ba-slider");
const baInput = document.querySelector(".ba-handle");
const baAfter = document.querySelector(".ba-after");
const baGrip = document.querySelector(".ba-grip");
if (baSlider && baInput && baAfter) {
  function updateBA(v) {
    const val = Number(v);
    baAfter.style.clipPath = `inset(0 0 0 ${val}%)`;
    if (baGrip) baGrip.style.left = `${val}%`;
  }
  baInput.addEventListener("input", () => updateBA(baInput.value));
  baInput.addEventListener("change", () => updateBA(baInput.value));
  updateBA(50);
}

// Project carousel - fade transition, random staggered timing
document.querySelectorAll("[data-carousel]").forEach((track, carouselIndex) => {
  const slides = track.querySelectorAll(".project-carousel-slide");
  if (slides.length <= 1) return;
  let idx = 0;
  slides[0].classList.add("active");

  function goTo(i) {
    const next = ((i % slides.length) + slides.length) % slides.length;
    slides[idx].classList.remove("active");
    slides[next].classList.add("active");
    idx = next;
  }

  // Random base interval 3.5–6s, ±600ms variance each cycle, random initial delay
  const baseInterval = 3500 + Math.random() * 2500;
  const initialDelay = Math.random() * 3500;
  const scheduleNext = () => {
    setTimeout(() => {
      goTo(idx + 1);
      scheduleNext();
    }, baseInterval + (Math.random() * 1200 - 600));
  };
  setTimeout(scheduleNext, initialDelay);
});

// Floating CTA & back-to-top
const floatingCta = document.getElementById("floating-cta");
const backToTop = document.getElementById("back-to-top");
let lastScroll = 0;

function updateFloatingElements() {
  const y = window.scrollY;
  const heroHeight = window.innerHeight * 0.6;
  if (y > heroHeight) {
    floatingCta?.classList.add("visible");
  } else {
    floatingCta?.classList.remove("visible");
  }
  if (y > 400) {
    backToTop?.classList.add("visible");
  } else {
    backToTop?.classList.remove("visible");
  }
  lastScroll = y;
}

window.addEventListener("scroll", updateFloatingElements, { passive: true });
backToTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

// Quote form: compress photos in-browser, submit via fetch to /api/quote
const quoteForm = document.getElementById("quote-form");
if (quoteForm) {
  const statusEl = document.getElementById("quote-status");
  const submitBtn = document.getElementById("quote-submit");
  const photosInput = document.getElementById("quote-photos");

  const MAX_DIMENSION = 1600; // px on the longest edge
  const JPEG_QUALITY = 0.7;
  const MAX_PHOTOS = 6;

  function setStatus(message, type) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.remove("hidden", "text-emerald-700", "text-red-600", "text-slate-500");
    statusEl.classList.add(
      type === "success" ? "text-emerald-700" : type === "error" ? "text-red-600" : "text-slate-500"
    );
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  async function compressImage(file) {
    const dataUrl = await readFileAsDataURL(file);
    // Non-images (or anything that fails to load) are skipped.
    if (!file.type.startsWith("image/")) return null;
    const img = await loadImage(dataUrl);
    let { width, height } = img;
    if (width > height && width > MAX_DIMENSION) {
      height = Math.round((height * MAX_DIMENSION) / width);
      width = MAX_DIMENSION;
    } else if (height > MAX_DIMENSION) {
      width = Math.round((width * MAX_DIMENSION) / height);
      height = MAX_DIMENSION;
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);
    const out = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    const base = (file.name || "photo").replace(/\.[^.]+$/, "");
    return { name: `${base}.jpg`, data: out };
  }

  quoteForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }
    setStatus("Preparing your request…", "info");

    try {
      const fd = new FormData(quoteForm);
      const payload = {
        name: fd.get("name"),
        phone: fd.get("phone"),
        email: fd.get("email"),
        service: fd.get("service"),
        location: fd.get("location"),
        size: fd.get("size"),
        timeline: fd.get("timeline"),
        details: fd.get("details"),
        company: fd.get("company"), // honeypot
        photos: [],
      };

      const files = photosInput && photosInput.files ? Array.from(photosInput.files) : [];
      if (files.length) {
        setStatus("Optimizing photos…", "info");
        for (const file of files.slice(0, MAX_PHOTOS)) {
          try {
            const compressed = await compressImage(file);
            if (compressed) payload.photos.push(compressed);
          } catch (err) {
            // Skip a photo that can't be processed rather than failing the whole form.
          }
        }
      }

      setStatus("Sending your request…", "info");
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));

      if (res.ok) {
        quoteForm.reset();
        setStatus("Thanks! Your request was sent. We'll be in touch shortly.", "success");
        if (submitBtn) submitBtn.textContent = "Sent ✓";
      } else {
        setStatus(
          result.error || "Sorry, something went wrong. Please call 613-720-9102.",
          "error"
        );
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Send Request";
        }
      }
    } catch (err) {
      setStatus("Network error. Please try again or call 613-720-9102.", "error");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send Request";
      }
    }
  });
}

// FAQ accordion
document.querySelectorAll(".faq-trigger").forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    const content = item?.querySelector(".faq-content");
    const icon = item?.querySelector(".faq-icon");
    const isOpen = btn.getAttribute("aria-expanded") === "true";
    // Close all others
    document.querySelectorAll(".faq-item").forEach((el) => {
      if (el !== item) {
        el.querySelector(".faq-content")?.classList.add("hidden");
        el.querySelector(".faq-trigger")?.setAttribute("aria-expanded", "false");
        el.querySelector(".faq-icon")?.classList.remove("rotate-180");
      }
    });
    if (isOpen) {
      content?.classList.add("hidden");
      btn.setAttribute("aria-expanded", "false");
      icon?.classList.remove("rotate-180");
    } else {
      content?.classList.remove("hidden");
      btn.setAttribute("aria-expanded", "true");
      icon?.classList.add("rotate-180");
    }
  });
});
