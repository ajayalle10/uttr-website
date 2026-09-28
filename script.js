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

// ---------------------------------------------------------------- Footer year
document.getElementById("year").textContent = new Date().getFullYear();
