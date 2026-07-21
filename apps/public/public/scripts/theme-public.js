(() => {
  try {
    const root = document.documentElement;
    const THEME_COLORS = { light: "#F7F7F5", dark: "#0B0D10" };
    const applyTheme = (theme) => {
      root.classList.toggle("dark", theme === "dark");
      root.dataset.theme = theme;
      root.style.colorScheme = theme;
      const meta = document.querySelector("meta[name=\"theme-color\"][data-dynamic-theme]");
      if (meta) {
        meta.setAttribute("content", THEME_COLORS[theme] || THEME_COLORS.light);
      }
    };

    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored || (prefersDark ? "dark" : "light");
    applyTheme(theme);

    document.addEventListener("click", (event) => {
      const target = event.target;
      const button = target instanceof Element ? target.closest("[data-theme-toggle]") : null;
      if (!button) return;
      const next = root.classList.contains("dark") ? "light" : "dark";
      applyTheme(next);
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
