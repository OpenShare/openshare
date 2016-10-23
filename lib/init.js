import initializeNodes from './initializeNodes';
import initializeWatcher from './initializeWatcher';

export default function init(opts) {
  return () => {
    const initNodes = initializeNodes({
      api: opts.api || null,
      container: opts.container || document,
      selector: opts.selector,
      cb: opts.cb,
    });

    initNodes();

    // check for mutation observers before using, IE11 only
    if (window.MutationObserver !== undefined) {
      initializeWatcher(document.querySelectorAll('[data-open-share-watch]'), initNodes);
    }
  };
}
