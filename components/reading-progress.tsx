type Props = {
  offset?: number;
};

const script = `
(() => {
  try {
    const root = document.documentElement;
    const container = document.querySelector('[data-reading-progress]');
    const bar = container?.querySelector('[data-reading-progress-bar]');
    if (!container || !bar) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const scrollTop = window.scrollY || 0;
      const docHeight = root.scrollHeight - window.innerHeight;
      const ratio = docHeight > 0 ? Math.min(1, Math.max(0, scrollTop / docHeight)) : 0;
      bar.style.transform = 'scaleX(' + ratio + ')';
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
  } catch {
    // ignore
  }
})();
`;

export function ReadingProgress({ offset = 0 }: Props) {
  return (
    <>
      <div
        className="fixed left-0 right-0 z-30 h-1"
        style={{ top: offset }}
        aria-hidden
        data-reading-progress
      >
        <div
          className="h-full origin-left rounded-r-full bg-border/80 will-change-transform dark:bg-border/70"
          style={{ transform: "scaleX(0)" }}
          data-reading-progress-bar
        />
      </div>
      <script dangerouslySetInnerHTML={{ __html: script }} />
    </>
  );
}

export default ReadingProgress;

