/**
 * main.js — page interactions for the Zhyvitsa site.
 * Handles: sticky header state, mobile nav toggle, scroll-reveal
 * animations, and wiring the VineGeometry background motif to scroll.
 */
import { VineGeometry } from './vine-geometry.js';

/* ---------- Sticky header ---------- */
const header = document.getElementById('siteHeader');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ---------- Mobile nav ---------- */
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
let lockedScrollY = 0;

function openMenu() {
  lockedScrollY = window.scrollY || window.pageYOffset || 0;
  document.body.style.top = `-${lockedScrollY}px`;
  document.documentElement.classList.add('nav-open');
  navLinks.classList.add('open');
  burger.classList.add('active');
  burger.setAttribute('aria-expanded', 'true');
}

function closeMenu() {
  document.documentElement.classList.remove('nav-open');
  document.body.style.top = '';
  navLinks.classList.remove('open');
  burger.classList.remove('active');
  burger.setAttribute('aria-expanded', 'false');
  // behavior:'instant' is required here — the page sets scroll-behavior:smooth
  // globally, which would otherwise animate this all the way from the top.
  window.scrollTo({ top: lockedScrollY, left: 0, behavior: 'instant' });
}

burger.addEventListener('click', () => {
  if (navLinks.classList.contains('open')) {
    closeMenu();
  } else {
    openMenu();
  }
});
navLinks.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', closeMenu)
);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navLinks.classList.contains('open')) closeMenu();
});

/* ---------- Scroll-reveal for content blocks ---------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

/* ---------- Vine background: render + scroll-bound reveal ---------- */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const vineMounts = document.querySelectorAll('.vine-bg[data-vine]');
const vineInstances = [];

vineMounts.forEach((mount) => {
  const { stem, branches } = VineGeometry.render(mount);
  const section = mount.closest('section') || mount;
  vineInstances.push({ mount, section, stem, branches });
});

// WebKit/Safari can report getTotalLength() as 0 if it's read in the same
// tick an SVG path is inserted into the DOM (layout hasn't run yet).
// Waiting a frame guarantees layout has completed before we measure.
requestAnimationFrame(() => {
  vineInstances.forEach(({ stem, branches }) => {
    branches.forEach((b) => {
      b.length = b.path.getTotalLength();
      if (reduceMotion || !b.length) {
        // Fail-safe: an unreliable measurement should never hide content —
        // show the branch fully rather than risk an invisible dash-array.
        b.path.style.strokeDasharray = 'none';
        b.path.style.strokeDashoffset = 0;
      } else {
        b.path.style.strokeDasharray = b.length;
        b.path.style.strokeDashoffset = b.length; // hidden past the anchor until scrolled
      }
    });

    if (reduceMotion) {
      stem.style.strokeDashoffset = 0;
      return;
    }

    const len = stem.getTotalLength();
    if (!len) {
      // Same fail-safe as above: never leave the stem invisible.
      stem.style.strokeDasharray = 'none';
      stem.style.strokeDashoffset = 0;
    } else {
      stem.style.strokeDasharray = len;
      stem.style.strokeDashoffset = len;
      stem.style.transition = 'stroke-dashoffset 2s cubic-bezier(.16,.84,.44,1)';
    }
  });

  if (!reduceMotion) {
    // Stem gets a one-time "grow in" reveal when it first scrolls into view.
    // We observe the HTML mount div rather than the raw SVG <path> — more
    // consistently supported by IntersectionObserver across browsers.
    const stemObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const inst = vineInstances.find((v) => v.mount === entry.target);
          if (inst) inst.stem.style.strokeDashoffset = 0;
          stemObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    vineInstances.forEach((v) => stemObserver.observe(v.mount));

    /**
     * Scroll progress (0..1) through a section: 0 as its bottom edge enters
     * the viewport bottom, 1 once its top edge has cleared the viewport top.
     */
    function getScrollProgress(el) {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const total = rect.height + vh;
      const scrolled = vh - rect.top;
      return Math.min(Math.max(scrolled / total, 0), 1);
    }

    let vineTicking = false;
    function updateVines() {
      vineInstances.forEach(({ section, branches }) => {
        const sectionProgress = getScrollProgress(section);
        branches.forEach((b) => {
          if (!b.length) return; // fail-safe branch has no dash animation to drive
          // Stagger each branch's growth window slightly along the scroll.
          const staggered = (sectionProgress - b.index * 0.12) * 1.5;
          const progress = Math.min(Math.max(staggered, 0), 1);
          // Anchor end (start of path) stays put; reveal grows toward the vortex tip.
          b.path.style.strokeDashoffset = b.length * (1 - progress);
        });
      });
      vineTicking = false;
    }
    window.addEventListener('scroll', () => {
      if (!vineTicking) {
        requestAnimationFrame(updateVines);
        vineTicking = true;
      }
    }, { passive: true });
    updateVines();
  }
});
