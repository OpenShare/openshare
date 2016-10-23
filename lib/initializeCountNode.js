import Count from '../src/modules/count';

export default function initializeCountNode(os) {
  // initialize open share object with type attribute
  const type = os.getAttribute('data-open-share-count');
  const url = os.getAttribute('data-open-share-count-repo') ||
      os.getAttribute('data-open-share-count-shot') ||
      os.getAttribute('data-open-share-count-url');
  const count = new Count(type, url);

  count.count(os);
  os.setAttribute('data-open-share-node', type);
}
