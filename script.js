/* =========================================================
   GSAP PAGE SCROLL + NAV
   ========================================================= */

const wrapper = document.getElementById("page-wrapper");
const sections = document.querySelectorAll(".section");
const navButtons = document.querySelectorAll(".nav-center button");

let currentIndex = 0;
let animating = false;

function updateNav(i) {
    navButtons.forEach(b => b.classList.remove("active"));
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
        }
    });
}

/* mouse wheel (desktop) */
window.addEventListener("wheel", (e) => {
    if (animating) return;

    if (e.deltaY > 0) {
        goTo(currentIndex + 1);
    } else {
        goTo(currentIndex - 1);
    }
}, { passive: true });

/* navbar buttons */
navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        goTo(parseInt(btn.dataset.index, 10));
    });
});

/* =========================================================
   TOUCH SWIPE (MOBILE)
   ========================================================= */

let touchStartY = 0;
let touchStartX = 0;
let touchStartTime = 0;

const SWIPE_Y_THRESHOLD = 50;
const SWIPE_X_CANCEL = 70;
const SWIPE_MAX_TIME = 700;

window.addEventListener("touchstart", (e) => {
    if (!e.touches || e.touches.length !== 1) return;

    const t = e.touches[0];
    touchStartY = t.clientY;
    touchStartX = t.clientX;
    touchStartTime = Date.now();
}, { passive: true });

window.addEventListener("touchend", (e) => {
    if (animating) return;
    if (!e.changedTouches || e.changedTouches.length !== 1) return;

    const t = e.changedTouches[0];
    const dy = t.clientY - touchStartY;
    const dx = t.clientX - touchStartX;
    const dt = Date.now() - touchStartTime;

    if (dt > SWIPE_MAX_TIME) return;
    if (Math.abs(dx) > SWIPE_X_CANCEL) return;
    if (Math.abs(dy) < SWIPE_Y_THRESHOLD) return;

    if (dy < 0) {
        goTo(currentIndex + 1); // swipe up
    } else {
        goTo(currentIndex - 1); // swipe down
    }
}, { passive: true });

/* =========================================================
   CAROUSEL
   ========================================================= */

const track = document.querySelector(".carousel-track");
const items = document.querySelectorAll(".carousel-item");
const arrowLeft = document.querySelector(".carousel-arrow.left");
const arrowRight = document.querySelector(".carousel-arrow.right");

const infoTitle = document.querySelector(".carousel-info h3");
const infoText = document.querySelector(".carousel-info p");

let carouselIndex = 0;
let carouselTimer = null;

function buildOverlays() {
    items.forEach(item => {
        const overlayContent = item.querySelector(".overlay-content");
        const overlay = item.querySelector(".carousel-overlay");
        const d = item.dataset;

        let html = "";

        if (d.director) html += `<p><strong>Director:</strong> ${d.director}</p>`;
        if (d.dop) html += `<p><strong>DOP:</strong> ${d.dop}</p>`;
        if (d.sound) html += `<p><strong>Sound:</strong> ${d.sound}</p>`;

        let icons = "";

        if (d.link) {
            icons += `
                <a href="${d.link}" target="_blank" class="icon-link vimeo">
                    <i class="fa-brands fa-vimeo-v"></i>
                </a>
            `;
        }

        if (d.imdb) {
            icons += `
                <a href="${d.imdb}" target="_blank" class="icon-link imdb">
                    <i class="fa-brands fa-imdb"></i>
                </a>
            `;
        }

        if (icons) {
            html += `<div class="overlay-icons">${icons}</div>`;
        }

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
}

function slideNext() {
    slideTo(carouselIndex + 1);
}

function slidePrev() {
    slideTo(carouselIndex - 1);
}

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
    arrowLeft.addEventListener("click", () => {
        stopCarousel();
        slidePrev();
        startCarousel();
    });

    arrowRight.addEventListener("click", () => {
        stopCarousel();
        slideNext();
        startCarousel();
    });
}

/* pause on hover / touch */
items.forEach(item => {
    item.addEventListener("mouseenter", stopCarousel);
    item.addEventListener("mouseleave", startCarousel);

    item.addEventListener("touchstart", stopCarousel, { passive: true });
    item.addEventListener("touchend", startCarousel, { passive: true });
});

/* =========================================================
   INIT
   ========================================================= */

updateNav(0);
buildOverlays();
updateCarouselInfo();
startCarousel();
