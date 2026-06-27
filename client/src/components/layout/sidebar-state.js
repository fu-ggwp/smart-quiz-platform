const SIDEBAR_COLLAPSED_KEY = "smart_quiz_sidebar_collapsed";
const SIDEBAR_COLLAPSED_EVENT = "smart_quiz_sidebar_collapsed_change";

export function getSavedSidebarCollapsed() {
  if (typeof window === "undefined") return false;

  return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
}

export function setSavedSidebarCollapsed(isCollapsed) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
  window.dispatchEvent(
    new CustomEvent(SIDEBAR_COLLAPSED_EVENT, { detail: { isCollapsed } }),
  );
}

export function toggleSavedSidebarCollapsed() {
  const nextCollapsed = !getSavedSidebarCollapsed();
  setSavedSidebarCollapsed(nextCollapsed);
  return nextCollapsed;
}

export function subscribeToSidebarCollapsed(listener) {
  if (typeof window === "undefined") return () => {};

  function handleChange(event) {
    listener(event.detail?.isCollapsed ?? getSavedSidebarCollapsed());
  }

  window.addEventListener(SIDEBAR_COLLAPSED_EVENT, handleChange);
  return () => window.removeEventListener(SIDEBAR_COLLAPSED_EVENT, handleChange);
}
