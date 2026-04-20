const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
const cursorGlow = document.querySelector(".cursor-glow");
const scrollProgress = document.querySelector(".scroll-progress");
const revealSections = document.querySelectorAll(".reveal-section");
const motionCards = document.querySelectorAll(".motion-card");

menuButton.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("is-open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealSections.forEach((section) => revealObserver.observe(section));

let pointerX = 0;
let pointerY = 0;
let cursorFrame = null;

const moveCursor = () => {
  cursorGlow.style.opacity = "1";
  cursorGlow.style.transform = `translate3d(${pointerX - 110}px, ${pointerY - 110}px, 0)`;
  cursorFrame = null;
};

window.addEventListener("pointermove", (event) => {
  pointerX = event.clientX;
  pointerY = event.clientY;

  if (!cursorFrame) {
    cursorFrame = requestAnimationFrame(moveCursor);
  }
});

window.addEventListener("pointerleave", () => {
  cursorGlow.style.opacity = "0";
});

window.addEventListener("scroll", () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  scrollProgress.style.transform = `scaleX(${progress})`;
});

motionCards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 8;
    const rotateX = ((0.5 - (y / rect.height)) * 8);

    card.style.setProperty("--rx", `${rotateX}deg`);
    card.style.setProperty("--ry", `${rotateY}deg`);
  });

  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  });
});
