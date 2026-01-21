/* ===== CAROUSEL ===== */
const track = document.querySelector(".carousel-track");
const items = document.querySelectorAll(".carousel-item");
const left = document.querySelector(".carousel-arrow.left");
const right = document.querySelector(".carousel-arrow.right");

const infoTitle = document.querySelector(".carousel-info h3");
const infoText = document.querySelector(".carousel-info p");

let index = 0;
let timer;

function buildOverlays() {
    items.forEach(item => {
        const o = item.querySelector(".overlay-content");
        const d = item.dataset;

        let html = "";

        if (d.type) html += `<p><strong>${d.type}</strong></p>`;
        if (d.director) html += `<p><strong>Director:</strong> ${d.director}</p>`;
        if (d.dop) html += `<p><strong>DOP:</strong> ${d.dop}</p>`;
        if (d.sound) html += `<p><strong>Sound:</strong> ${d.sound}</p>`;

        let icons = "";

        if (d.vimeo) {
            icons += `<a href="${d.vimeo}" target="_blank" class="icon-link vimeo">
                        <i class="fa-brands fa-vimeo-v"></i>
                      </a>`;
        }

        if (d.youtube) {
            icons += `<a href="${d.youtube}" target="_blank" class="icon-link vimeo">
                        <i class="fa-brands fa-youtube"></i>
                      </a>`;
        }

        if (d.imdb) {
            icons += `<a href="${d.imdb}" target="_blank" class="icon-link imdb">
                        <i class="fa-brands fa-imdb"></i>
                      </a>`;
        }

        if (icons) {
            html += `<div class="overlay-icons">${icons}</div>`;
        }

        if (!html) {
            item.querySelector(".carousel-overlay").style.display = "none";
        } else {
            o.innerHTML = html;
        }
    });
}

function updateInfo() {
    infoTitle.textContent = items[index].dataset.title || "";
    infoText.textContent = "";
}

function slideTo(i) {
    track.style.transform = `translateX(${-i * 100}%)`;
    updateInfo();
}

function next() {
    index = (index + 1) % items.length;
    slideTo(index);
}
function prev() {
    index = (index - 1 + items.length) % items.length;
    slideTo(index);
}

left.onclick = () => { stop(); prev(); start(); };
right.onclick = () => { stop(); next(); start(); };

function start() {
    timer = setInterval(next, 4500);
}
function stop() {
    clearInterval(timer);
}

items.forEach(item => {
    item.addEventListener("mouseenter", stop);
    item.addEventListener("mouseleave", start);
});

buildOverlays();
updateInfo();
start();

/* ===== PAGE SCROLL (GSAP) ===== */
const wrapper = document.getElementById("page-wrapper");
const sections = document.querySelectorAll(".section");
const navButtons = document.querySelectorAll(".nav-center button");

let currentIndex = 0;
let animating = false;

function goTo(i) {
    if (i < 0 || i >= sections.length || animating) return;
    animating = true;

    gsap.to(wrapper, {
        y: -i * window.innerHeight,
        duration: 0.9,
        ease: "power3.inOut",
        onComplete: () => {
            currentIndex = i;
            animating = false;
            navButtons.forEach(b => b.classList.remove("active"));
            navButtons[i].classList.add("active");
        }
    });
}

window.addEventListener("wheel", e => {
    if (e.deltaY > 0) goTo(currentIndex + 1);
    else goTo(currentIndex - 1);
},{passive:true});

navButtons.forEach(btn =>
    btn.addEventListener("click", () => goTo(+btn.dataset.index))
);
