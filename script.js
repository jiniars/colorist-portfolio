/* =========================================================
   GSAP PAGE SCROLL + NAV
   ========================================================= */

const wrapper = document.getElementById("page-wrapper");
const sections = document.querySelectorAll(".section");
const navButtons = document.querySelectorAll(".nav-center button");

let currentIndex = 0;
let animating = false;

function updateNav(i) {
  navButtons.forEach((b) => b.classList.remove("active"));
  if (navButtons[i]) navButtons[i].classList.add("active");
}

function goTo(i) {
  if (i < 0 || i >= sections.length) return;
  if (animating || i === currentIndex) return;

  animating = true;

  gsap.to(wrapper, {
    y: -i * window.innerHeight,
    duration: 0.9,
    ease: "power3.inOut",
    onComplete: () => {
      currentIndex = i;
      animating = false;
      updateNav(i);

      if (sections[currentIndex]?.classList.contains("about")) playAboutRevealOnce();
      if (sections[currentIndex]?.classList.contains("contact")) playContactRevealOnce();
    },
  });
}

/* mouse wheel (desktop) */
window.addEventListener(
  "wheel",
  (e) => {
    if (animating) return;
    if (e.deltaY > 0) goTo(currentIndex + 1);
    else goTo(currentIndex - 1);
  },
  { passive: true }
);

/* navbar buttons */
navButtons.forEach((btn) => {
  btn.addEventListener("click", () => goTo(parseInt(btn.dataset.index, 10)));
});

/* =========================================================
   TOUCH SWIPE (MOBILE) - page up/down
   ========================================================= */

let touchStartY = 0;
let touchStartX = 0;
let touchStartTime = 0;

const SWIPE_Y_THRESHOLD = 50;
const SWIPE_X_CANCEL = 70;
const SWIPE_MAX_TIME = 700;

window.addEventListener(
  "touchstart",
  (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStartY = t.clientY;
    touchStartX = t.clientX;
    touchStartTime = Date.now();
  },
  { passive: true }
);

window.addEventListener(
  "touchend",
  (e) => {
    if (animating) return;
    if (!e.changedTouches || e.changedTouches.length !== 1) return;

    const t = e.changedTouches[0];
    const dy = t.clientY - touchStartY;
    const dx = t.clientX - touchStartX;
    const dt = Date.now() - touchStartTime;

    if (dt > SWIPE_MAX_TIME) return;

    // pokud je hodně do strany, necháme to na carousel swipe (HOME)
    if (Math.abs(dx) > SWIPE_X_CANCEL) return;

    if (Math.abs(dy) < SWIPE_Y_THRESHOLD) return;

    if (dy < 0) goTo(currentIndex + 1);
    else goTo(currentIndex - 1);
  },
  { passive: true }
);

/* =========================================================
   CAROUSEL
   ========================================================= */

const track = document.querySelector(".carousel-track");
const items = document.querySelectorAll(".carousel-item");
const arrowLeft = document.querySelector(".carousel-arrow.left");
const arrowRight = document.querySelector(".carousel-arrow.right");
const carouselWrapper = document.querySelector(".project-carousel-wrapper");

const infoTitle = document.querySelector(".carousel-info h3");
const infoText = document.querySelector(".carousel-info p");

let carouselIndex = 0;
let carouselTimer = null;

function buildOverlays() {
  items.forEach((item) => {
    const overlayContent = item.querySelector(".overlay-content");
    const overlay = item.querySelector(".carousel-overlay");
    const d = item.dataset;

    let html = "";

    if (d.director) html += `<p><strong>Director:</strong> ${d.director}</p>`;
    if (d.dop) html += `<p><strong>DOP:</strong> ${d.dop}</p>`;
    if (d.sound) html += `<p><strong>Sound:</strong> ${d.sound}</p>`;

    let icons = "";

    if (d.vimeo) {
      icons += `
        <a href="${d.vimeo}" target="_blank" class="icon-link vimeo" aria-label="Vimeo link">
          <i class="fa-brands fa-vimeo-v"></i>
        </a>`;
    }

    if (d.youtube) {
      icons += `
        <a href="${d.youtube}" target="_blank" class="icon-link youtube" aria-label="YouTube link">
          <i class="fa-brands fa-youtube"></i>
        </a>`;
    }

    if (d.imdb) {
      icons += `
        <a href="${d.imdb}" target="_blank" class="icon-link imdb" aria-label="IMDb link">
          <i class="fa-brands fa-imdb"></i>
        </a>`;
    }

    if (icons) html += `<div class="overlay-icons">${icons}</div>`;

    if (!html) {
      overlay.style.display = "none";
    } else {
      overlayContent.innerHTML = html;
    }
  });
}

function updateCarouselInfo() {
  if (!items[carouselIndex]) return;
  infoTitle.textContent = items[carouselIndex].dataset.title || "";
  infoText.textContent = "";
}

function slideTo(i) {
  carouselIndex = (i + items.length) % items.length;
  track.style.transform = `translateX(${-carouselIndex * 100}%)`;
  updateCarouselInfo();
  prefetchNeighborCarouselImages();
}

function slideNext() { slideTo(carouselIndex + 1); }
function slidePrev() { slideTo(carouselIndex - 1); }

function startCarousel() {
  stopCarousel();
  carouselTimer = setInterval(slideNext, 4500);
}

function stopCarousel() {
  if (carouselTimer) {
    clearInterval(carouselTimer);
    carouselTimer = null;
  }
}

/* arrows */
if (arrowLeft && arrowRight) {
  arrowLeft.addEventListener("click", () => { stopCarousel(); slidePrev(); startCarousel(); });
  arrowRight.addEventListener("click", () => { stopCarousel(); slideNext(); startCarousel(); });
}

/* pause on hover/touch */
items.forEach((item) => {
  item.addEventListener("mouseenter", stopCarousel);
  item.addEventListener("mouseleave", startCarousel);
  item.addEventListener("touchstart", stopCarousel, { passive: true });
  item.addEventListener("touchend", startCarousel, { passive: true });
});

/* =========================================================
   CAROUSEL SWIPE LEFT/RIGHT + SNAP FEEL + OVERLAY GUARD
   ========================================================= */

function isOnHomeSection() {
  return currentIndex === 0;
}

let cStartX = 0;
let cStartY = 0;
let cStartTime = 0;
let overlaySwipe = false; // když swipuje overlay, blokujeme klik

const CAROUSEL_SWIPE_X_THRESHOLD = 45;
const CAROUSEL_SWIPE_Y_CANCEL = 60;
const CAROUSEL_SWIPE_MAX_TIME = 900;
const OVERLAY_DRAG_THRESHOLD = 14; // od kdy to bereme jako swipe a blokujeme klik

function snapCarouselBack() {
  // "snap feel" – drobný animovaný návrat do přesné pozice (když byl swipe moc malý)
  gsap.to(track, {
    x: 0,
    duration: 0.22,
    ease: "power2.out",
    onComplete: () => { track.style.transform = `translateX(${-carouselIndex * 100}%)`; }
  });
}

function applyDrag(dx) {
  // jemný "drag" efekt během swipu (jen vizuálně)
  gsap.set(track, { x: dx * 0.25 });
}

function bindOverlaySwipeGuard(item) {
  const overlay = item.querySelector(".carousel-overlay");
  if (!overlay) return;

  overlay.addEventListener("touchstart", (e) => {
    if (!isOnHomeSection()) return;
    overlaySwipe = false;
  }, { passive: true });

  overlay.addEventListener("touchmove", (e) => {
    if (!isOnHomeSection()) return;
    if (!e.touches || e.touches.length !== 1) return;

    const t = e.touches[0];
    const dx = t.clientX - cStartX;
    const dy = t.clientY - cStartY;

    // když uživatel táhne, ber to jako swipe -> zablokuj click na link
    if (Math.abs(dx) > OVERLAY_DRAG_THRESHOLD || Math.abs(dy) > OVERLAY_DRAG_THRESHOLD) {
      overlaySwipe = true;
    }
  }, { passive: true });

  // blok kliků na <a> pokud se opravdu swipovalo
  overlay.addEventListener("click", (e) => {
    if (overlaySwipe) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  overlay.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", (e) => {
      if (overlaySwipe) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
  });
}

/* navážeme guard na všechny itemy */
items.forEach(bindOverlaySwipeGuard);

if (carouselWrapper) {
  carouselWrapper.addEventListener("touchstart", (e) => {
    if (!isOnHomeSection()) return;
    if (!e.touches || e.touches.length !== 1) return;

    const t = e.touches[0];
    cStartX = t.clientX;
    cStartY = t.clientY;
    cStartTime = Date.now();
    overlaySwipe = false; // reset
    stopCarousel();
  }, { passive: true });

  carouselWrapper.addEventListener("touchmove", (e) => {
    if (!isOnHomeSection()) return;
    if (!e.touches || e.touches.length !== 1) return;

    const t = e.touches[0];
    const dx = t.clientX - cStartX;
    const dy = t.clientY - cStartY;

    // pokud je to moc vertikální, nech to page swipe a nedraguj carousel
    if (Math.abs(dy) > CAROUSEL_SWIPE_Y_CANCEL) return;

    // vizuální drag (snap feel)
    applyDrag(dx);
  }, { passive: true });

  carouselWrapper.addEventListener("touchend", (e) => {
    if (!isOnHomeSection()) return;
    if (!e.changedTouches || e.changedTouches.length !== 1) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - cStartX;
    const dy = t.clientY - cStartY;
    const dt = Date.now() - cStartTime;

    // pokud hodně vertikální, neřeš carousel (page swipe to řeší)
    if (Math.abs(dy) > CAROUSEL_SWIPE_Y_CANCEL) {
      snapCarouselBack();
      startCarousel();
      return;
    }

    // moc dlouhé držení
    if (dt > CAROUSEL_SWIPE_MAX_TIME) {
      snapCarouselBack();
      startCarousel();
      return;
    }

    // malé gesto -> snap back
    if (Math.abs(dx) < CAROUSEL_SWIPE_X_THRESHOLD) {
      snapCarouselBack();
      startCarousel();
      return;
    }

    // swipe left/right
    gsap.set(track, { x: 0 }); // reset drag offset
    if (dx < 0) slideNext();
    else slidePrev();

    startCarousel();
  }, { passive: true });
}

/* =========================================================
   LAZY-LOADING IMAGES
   ========================================================= */

function enableLazyLoading() {
  document.querySelectorAll("img").forEach((img) => {
    if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
    if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
    img.setAttribute("draggable", "false");
  });
}

function prefetchNeighborCarouselImages() {
  if (!items.length) return;

  const nextIndex = (carouselIndex + 1) % items.length;
  const prevIndex = (carouselIndex - 1 + items.length) % items.length;

  [nextIndex, prevIndex].forEach((idx) => {
    const img = items[idx]?.querySelector("img");
    const src = img?.getAttribute("src");
    if (!src) return;
    const preImg = new Image();
    preImg.src = src;
  });
}

/* =========================================================
   GSAP REVEAL: ABOUT + CONTACT
   ========================================================= */

let aboutRevealPlayed = false;
let contactRevealPlayed = false;

function playAboutRevealOnce() {
  if (aboutRevealPlayed) return;

  const about = document.querySelector(".section.about");
  if (!about) return;

  const avatar = about.querySelector(".avatar");
  const h2 = about.querySelector("h2");
  const ps = about.querySelectorAll("p");

  const tl = gsap.timeline({
    defaults: { ease: "power3.out", duration: 0.7 },
    onComplete: () => (aboutRevealPlayed = true),
  });

  if (avatar) gsap.set(avatar, { opacity: 0, y: 16, scale: 0.98 });
  if (h2) gsap.set(h2, { opacity: 0, y: 10 });
  if (ps?.length) gsap.set(ps, { opacity: 0, y: 10 });

  if (avatar) tl.to(avatar, { opacity: 1, y: 0, scale: 1 }, 0);
  if (h2) tl.to(h2, { opacity: 1, y: 0 }, 0.08);
  if (ps?.length) tl.to(ps, { opacity: 1, y: 0, stagger: 0.08 }, 0.14);
}

function playContactRevealOnce() {
  if (contactRevealPlayed) return;

  const contact = document.querySelector(".section.contact");
  if (!contact) return;

  const h2 = contact.querySelector("h2");
  const ps = contact.querySelectorAll("p");
  const btn = contact.querySelector(".contact-btn");

  const tl = gsap.timeline({
    defaults: { ease: "power3.out", duration: 0.65 },
    onComplete: () => (contactRevealPlayed = true),
  });

  if (h2) gsap.set(h2, { opacity: 0, y: 10 });
  if (ps?.length) gsap.set(ps, { opacity: 0, y: 10 });
  if (btn) gsap.set(btn, { opacity: 0, y: 10, scale: 0.99 });

  if (h2) tl.to(h2, { opacity: 1, y: 0 }, 0);
  if (ps?.length) tl.to(ps, { opacity: 1, y: 0, stagger: 0.08 }, 0.08);
  if (btn) tl.to(btn, { opacity: 1, y: 0, scale: 1 }, 0.22);
}

/* =========================================================
   INIT
   ========================================================= */

updateNav(0);
enableLazyLoading();

buildOverlays();
updateCarouselInfo();
prefetchNeighborCarouselImages();
startCarousel();

window.addEventListener("resize", () => {
  gsap.set(wrapper, { y: -currentIndex * window.innerHeight });
});
