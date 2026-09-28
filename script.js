/**
 * Uttr website — small bits of interactivity.
 * The page works without this script; it just adds the tabs and a hint.
 */

// Tells the CSS that JavaScript is running (so the tabs are shown).
document.documentElement.classList.add("js");

// ---------------------------------------------------------------- Tabs
// "Windows app" / "Browser extension" in the How to use section.
const tabs = document.querySelectorAll(".tab");

function selectTab(tab) {
  tabs.forEach((t) => {
    const selected = t === tab;
    t.setAttribute("aria-selected", String(selected));
    t.tabIndex = selected ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !selected;
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => selectTab(tab));
  // Left/right arrow keys move between tabs (standard tab keyboard behaviour).
  tab.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const list = [...tabs];
    const next = list[(list.indexOf(tab) + (event.key === "ArrowRight" ? 1 : list.length - 1)) % list.length];
    selectTab(next);
    next.focus();
  });
});

// Links like #guide-extension open the right tab.
if (tabs.length) {
  const fromHash = [...tabs].find((t) => `#${t.getAttribute("aria-controls")}` === location.hash);
  selectTab(fromHash || tabs[0]);
}

// ---------------------------------------------------------------- Hint for non-Windows visitors
// The Windows app is Windows-only. On a Mac or phone, point people to the right option.
const note = document.getElementById("os-note");
const platform = (navigator.userAgentData?.platform || navigator.platform || "").toLowerCase();
const ua = navigator.userAgent.toLowerCase();

if (note) {
  if (/android|iphone|ipad/.test(ua)) {
    note.textContent = "📱 Uttr runs on computers. Open this page on your Windows PC or Mac to install it.";
    note.hidden = false;
  } else if (/mac/.test(platform)) {
    note.textContent = "🍎 On a Mac? Get the browser extension. It works in Chrome, Edge and Brave.";
    note.hidden = false;
  }
}

// ---------------------------------------------------------------- Live stats
// Real numbers only. Anything that can't be loaded is hidden, never faked.

const COUNTER = "https://abacus.jasoncameron.dev";
const COUNTER_NAMESPACE = "ajayalle10-uttr-website";

// Downloads = the real installer/extension files people download. The small
// files the Windows app fetches to check for updates (latest.yml, .blockmap)
// are not counted.
const DOWNLOAD_REPOS = ["ajayalle10/uttr-desktop", "ajayalle10/uttr-chrome-extension"];
const DOWNLOAD_FILES = ["Uttr-Setup.exe", "uttr.zip", "uttr-firefox.zip"];

// Browser storage can be blocked (private windows, strict settings), so every
// use is wrapped: the counters still work, just without the extras.
const store = {
  get(area, key) { try { return window[area].getItem(key); } catch { return null; } },
  set(area, key, value) { try { window[area].setItem(key, value); } catch {} },
};

/**
 * Visits: add one the first time this page is opened in a browser session,
 * so refreshing doesn't inflate the number. Returns the total.
 */
async function loadVisits() {
  const alreadyCounted = store.get("sessionStorage", "uttr-visit-counted");
  const url = alreadyCounted ? `${COUNTER}/get/${COUNTER_NAMESPACE}/visits` : `${COUNTER}/hit/${COUNTER_NAMESPACE}/visits`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("counter unavailable");
  const { value } = await response.json();
  store.set("sessionStorage", "uttr-visit-counted", "1");
  return value;
}

/**
 * Downloads: GitHub counts every download of every release file. Add up the
 * installer and extension files across all releases of both projects.
 * Cached for 10 minutes (GitHub allows each visitor 60 lookups an hour).
 */
async function loadDownloads() {
  const cached = JSON.parse(store.get("localStorage", "uttr-downloads") || "null");
  if (cached && Date.now() - cached.time < 10 * 60 * 1000) return cached.total;

  const perRepo = await Promise.all(DOWNLOAD_REPOS.map(async (repo) => {
    const response = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=100`);
    if (!response.ok) throw new Error("GitHub unavailable");
    const releases = await response.json();
    return releases.flatMap((r) => r.assets)
      .filter((asset) => DOWNLOAD_FILES.includes(asset.name))
      .reduce((sum, asset) => sum + asset.download_count, 0);
  }));
  const total = perRepo.reduce((a, b) => a + b, 0);
  store.set("localStorage", "uttr-downloads", JSON.stringify({ total, time: Date.now() }));
  return total;
}

/** Count up from 0 to `value` (instantly if the visitor prefers less motion). */
function showNumber(id, value) {
  const el = document.getElementById(id);
  document.getElementById(`${id}-box`).hidden = false;
  const format = (n) => Math.round(n).toLocaleString();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || value < 10) {
    el.textContent = format(value);
    return;
  }
  const start = performance.now();
  const duration = 1200;
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = format(value * (1 - Math.pow(1 - t, 3))); // ease-out
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

loadVisits().then((n) => showNumber("stat-visits", n)).catch(() => {});
loadDownloads().then((n) => showNumber("stat-downloads", n)).catch(() => {});

// ---------------------------------------------------------------- Footer year
document.getElementById("year").textContent = new Date().getFullYear();
