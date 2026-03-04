(() => {
  try {
    const root = document.documentElement;
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored || (prefersDark ? "dark" : "light");
    root.classList.toggle("dark", theme === "dark");
    root.dataset.theme = theme;
    root.style.colorScheme = theme;

    document.addEventListener("click", (event) => {
      const target = event.target;
      const button = target instanceof Element ? target.closest("[data-theme-toggle]") : null;
      if (!button) return;
      const next = root.classList.contains("dark") ? "light" : "dark";
      root.classList.toggle("dark", next === "dark");
      root.dataset.theme = next;
      root.style.colorScheme = next;
      try {
        localStorage.setItem("theme", next);
      } catch {
        // Ignore localStorage write errors.
      }
    });
  } catch {
    // Ignore theme bootstrap failures.
  }
})();
