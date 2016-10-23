export default function initializeWatcher(watcher, fn) {
  [].forEach.call(watcher, (w) => {
    const observer = new MutationObserver((mutations) => {
      // target will match between all mutations so just use first
      fn(mutations[0].target);
    });

    observer.observe(w, {
      childList: true,
    });
  });
}
