/* =========================================================
   iOS Safari viewport fix: --vh
   ========================================================= */
function setVhVar() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}
setVhVar();
window.addEventListener("resize", setVhVar);

/* =========================================================
   Color wheel rotation
   ========================================================= */
const colorWheel = document.getElementById("colorWheel");
const ROT_PER_PAGE = 48; // degrees per section

function rotateWheelToIndex(targetIndex, duration = 0.95) {
  if (!colorWheel) return;
  const targetRot = targetIndex * ROT_PER_PAGE;

  gsap.to(colorWheel, {
    rotation: targetRot,
    duration,
    ease: "power3.inOut",
    overwrite: true,
  });
}

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

  const vh = window.innerHeight;
  const DUR = 0.95;

  gsap.to(wrapper, {
    y: -i * vh,
    duration: DUR,
    ease: "power3.inOut",
    onComplete: () => {
      currentIndex = i;
      animating = false;
      updateNav(i);

      if (sections[currentIndex]?.classList.contains("about")) playAboutRevealOnce();
      if (sections[currentIndex]?.classList.contains("contact")) playContactRevealOnce();
    },
  });

  rotateWheelToIndex(i, DUR);
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

const SWIPE_Y_THRESHOLD = 55;
const SWIPE_X_CANCEL = 75;
const SWIPE_MAX_TIME = 750;

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

    // pokud hodně do strany, necháme na carousel swipe
    if (Math.abs(dx) > SWIPE_X_CANCEL) return;

    if (Math.abs(dy) < SWIPE_Y_THRESHOLD) return;

    if (dy < 0) goTo(currentIndex + 1);
    else goTo(currentIndex - 1);
  },
  { passive: true }
);

/* =========================================================
   LAZY LOADING
   ========================================================= */
function enableLazyLoading() {
  document.querySelectorAll("img").forEach((img) => {
    if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
    if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
    img.setAttribute("draggable", "false");
  });
}

/* =========================================================
   3-UP CAROUSEL (smooth slide + subtle wrapper fade)
   ========================================================= */
const PROJECTS = [
  {
    title: "Vzpomínka / Remembrance",
    type: "Student Short Film",
    director: "Ondřej Vasilovčík",
    dop: "",
    sound: "Martin Bezouška",
    youtube: "https://www.youtube.com/watch?v=3vBnKBwoHIQ",
    imdb: "",
    src: "https://i.imgur.com/HVIwtyf.jpeg"
  },
  {
    title: "Project 2",
    type: "Commercial",
    director: "—",
    dop: "",
    sound: "",
    youtube: "https://www.youtube.com/watch?v=3vBnKBwoHIQ",
    imdb: "",
    src: "https://i.imgur.com/FYCgd7d.jpeg"
  },
  {
    title: "Project 3",
    type: "Music Video",
    director: "—",
    dop: "",
    sound: "",
    youtube: "https://www.youtube.com/watch?v=3vBnKBwoHIQ",
    imdb: "https://www.imdb.com/",
    src: "https://i.imgur.com/akUiLTc.jpeg"
  },
  {
    title: "Project 4",
    type: "Short Film",
    director: "—",
    dop: "",
    sound: "",
    youtube: "https://www.youtube.com/watch?v=3vBnKBwoHIQ",
    imdb: "https://www.imdb.com/",
    src: "https://i.imgur.com/jBTBD2Z.jpeg"
  }
];

const carousel = document.getElementById("carousel3up");

const panelPrev = document.querySelector(".carousel-panel.prev");
const panelCur  = document.querySelector(".carousel-panel.current");
const panelNext = document.querySelector(".carousel-panel.next");

const imgPrev = document.getElementById("imgPrev");
const imgCur  = document.getElementById("imgCurrent");
const imgNext = document.getElementById("imgNext");

const overlayContent = document.querySelector(".carousel-panel.current .overlay-content");
const overlayEl = document.querySelector(".carousel-panel.current .carousel-overlay");

const infoTitle = document.querySelector(".carousel-info h3");
const infoText  = document.querySelector(".carousel-info p");

let carouselIndex = 0;
let carouselTimer = null;
let carouselAnimating = false;
let overlaySwipe = false;

const AUTO_INTERVAL = 9000; // ✅ slower
const TRANS_DUR = 0.85;     // ✅ smoother
const TRANS_EASE = "power3.inOut";

function mod(n, m){ return ((n % m) + m) % m; }

function setImg(imgEl, url){
  if (!imgEl || !url) return;
  imgEl.loading = "lazy";
  imgEl.decoding = "async";
  imgEl.draggable = false;
  imgEl.src = url;
}

function buildOverlay(d){
  if (!overlayContent || !overlayEl) return;

  let html = "";

  if (d.type)     html += `<p><strong>${d.type}</strong></p>`;
  if (d.director) html += `<p><strong>Director:</strong> ${d.director}</p>`;
  if (d.dop)      html += `<p><strong>DOP:</strong> ${d.dop}</p>`;
  if (d.sound)    html += `<p><strong>Sound:</strong> ${d.sound}</p>`;

  let icons = "";

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

  overlayContent.innerHTML = html;
  overlayEl.style.display = html ? "flex" : "none";
}

function updateCarouselInfo(cur){
  if (!infoTitle || !infoText) return;
  infoTitle.textContent = cur?.title || "";
  infoText.textContent  = cur?.type || "";
}

function renderCarouselImmediate(){
  const total = PROJECTS.length;
  if (!total) return;

  const prev = PROJECTS[mod(carouselIndex - 1, total)];
  const cur  = PROJECTS[mod(carouselIndex, total)];
  const next = PROJECTS[mod(carouselIndex + 1, total)];

  setImg(imgPrev, prev.src);
  setImg(imgCur,  cur.src);
  setImg(imgNext, next.src);

  updateCarouselInfo(cur);
  buildOverlay(cur);
  prefetchNeighborImages();
}

function prefetchNeighborImages(){
  const total = PROJECTS.length;
  if (!total) return;

  const a = PROJECTS[mod(carouselIndex + 1, total)]?.src;
  const b = PROJECTS[mod(carouselIndex - 1, total)]?.src;

  [a,b].forEach(src => {
    if (!src) return;
    const im = new Image();
    im.src = src;
  });
}

function startCarousel(){
  stopCarousel();
  carouselTimer = setInterval(() => slideProject(1), AUTO_INTERVAL);
}

function stopCarousel(){
  if (carouselTimer){
    clearInterval(carouselTimer);
    carouselTimer = null;
  }
}

/* ✅ New slide: no per-image opacity blinking, only smooth slide + subtle wrapper fade */
function slideProject(dir){
  if (carouselAnimating) return;
  if (!carousel) return;

  carouselAnimating = true;

  const total = PROJECTS.length;
  const newIndex = mod(carouselIndex + dir, total);

  const prev = PROJECTS[mod(newIndex - 1, total)];
  const cur  = PROJECTS[mod(newIndex, total)];
  const next = PROJECTS[mod(newIndex + 1, total)];

  const shift = dir > 0 ? -240 : 240;

  gsap.timeline({
    defaults: { ease: TRANS_EASE },
    onComplete: () => {
      carouselIndex = newIndex;

      setImg(imgPrev, prev.src);
      setImg(imgCur,  cur.src);
      setImg(imgNext, next.src);

      updateCarouselInfo(cur);
      buildOverlay(cur);
      prefetchNeighborImages();

      gsap.set([panelPrev, panelCur, panelNext], { x: 0 });
      carouselAnimating = false;
    }
  })
  .to(carousel, { opacity: 0.95, duration: 0.18 }, 0)
  .to([panelPrev, panelCur, panelNext], { x: shift, duration: TRANS_DUR }, 0)
  .to(carousel, { opacity: 1, duration: 0.22 }, Math.max(0, TRANS_DUR - 0.12));
}

/* pause on hover/touch */
if (carousel){
  carousel.addEventListener("mouseenter", stopCarousel);
  carousel.addEventListener("mouseleave", startCarousel);
  carousel.addEventListener("touchstart", stopCarousel, { passive:true });
  carousel.addEventListener("touchend", startCarousel, { passive:true });
}

/* =========================================================
   CAROUSEL SWIPE LEFT/RIGHT + SNAP + OVERLAY GUARD
   ========================================================= */
let cStartX=0, cStartY=0, cStartTime=0;

const CAROUSEL_SWIPE_X_THRESHOLD = 45;
const CAROUSEL_SWIPE_Y_CANCEL = 65;
const CAROUSEL_SWIPE_MAX_TIME = 900;
const OVERLAY_DRAG_THRESHOLD = 14;

function isOnHome(){ return currentIndex === 0; }

if (carousel){
  carousel.addEventListener("touchstart", (e) => {
    if (!isOnHome()) return;
    if (!e.touches || e.touches.length !== 1) return;

    const t = e.touches[0];
    cStartX = t.clientX;
    cStartY = t.clientY;
    cStartTime = Date.now();
    overlaySwipe = false;
    stopCarousel();
  }, { passive:true });

  carousel.addEventListener("touchmove", (e) => {
    if (!isOnHome()) return;
    if (!e.touches || e.touches.length !== 1) return;

    const t = e.touches[0];
    const dx = t.clientX - cStartX;
    const dy = t.clientY - cStartY;

    // pokud hodně vertikálně, nech to na page swipe
    if (Math.abs(dy) > CAROUSEL_SWIPE_Y_CANCEL) return;

    // overlay guard: pokud uživatel tahá, neklikat odkazy
    if (Math.abs(dx) > OVERLAY_DRAG_THRESHOLD || Math.abs(dy) > OVERLAY_DRAG_THRESHOLD){
      overlaySwipe = true;
    }

    // “drag feel” jen na panely
    gsap.set(panelCur,  { x: dx * 0.18 });
    gsap.set(panelPrev, { x: dx * 0.10 });
    gsap.set(panelNext, { x: dx * 0.10 });
  }, { passive:true });

  carousel.addEventListener("touchend", (e) => {
    if (!isOnHome()) return;

    const t = e.changedTouches?.[0];
    const dx = (t?.clientX ?? cStartX) - cStartX;
    const dy = (t?.clientY ?? cStartY) - cStartY;
    const dt = Date.now() - cStartTime;

    // snap back (always)
    gsap.to([panelCur, panelPrev, panelNext], {
      x: 0,
      duration: 0.22,
      ease: "power2.out"
    });

    // pokud je to vertikální swipe, nech to page swipe
    if (Math.abs(dy) > CAROUSEL_SWIPE_Y_CANCEL) { startCarousel(); return; }
    if (dt > CAROUSEL_SWIPE_MAX_TIME) { startCarousel(); return; }
    if (Math.abs(dx) < CAROUSEL_SWIPE_X_THRESHOLD) { startCarousel(); return; }

    if (dx < 0) slideProject(1);
    else slideProject(-1);

    startCarousel();
  }, { passive:true });
}

/* overlay click guard */
if (overlayEl){
  overlayEl.addEventListener("click", (e) => {
    if (overlaySwipe) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  overlayEl.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", (e) => {
      if (overlaySwipe) { e.preventDefault(); e.stopPropagation(); }
    }, true);
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
  const lead = contact.querySelector(".lead");
  const btn = contact.querySelector(".contact-btn");

  const tl = gsap.timeline({
    defaults: { ease: "power3.out", duration: 0.65 },
    onComplete: () => (contactRevealPlayed = true),
  });

  if (h2) gsap.set(h2, { opacity: 0, y: 10 });
  if (lead) gsap.set(lead, { opacity: 0, y: 10 });
  if (btn) gsap.set(btn, { opacity: 0, y: 10, scale: 0.99 });

  if (h2) tl.to(h2, { opacity: 1, y: 0 }, 0);
  if (lead) tl.to(lead, { opacity: 1, y: 0 }, 0.08);
  if (btn) tl.to(btn, { opacity: 1, y: 0, scale: 1 }, 0.18);
}

/* =========================================================
   INIT
   ========================================================= */
enableLazyLoading();
updateNav(0);
renderCarouselImmediate();
startCarousel();
rotateWheelToIndex(0, 0.001);

window.addEventListener("resize", () => {
  gsap.set(wrapper, { y: -currentIndex * window.innerHeight });
});
