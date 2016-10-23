import ShareTransforms from '../src/modules/share-transforms';
import OpenShare from '../src/modules/open-share';
import setData from './setData';
import share from './share';
import dashToCamel from './dashToCamel';

export default function initializeShareNode(os) {
  // initialize open share object with type attribute
  let type = os.getAttribute('data-open-share');
  const dash = type.indexOf('-');

  if (dash > -1) {
    type = dashToCamel(dash, type);
  }

  const transform = ShareTransforms[type];

  if (!transform) {
    throw new Error(`Open Share: ${type} is an invalid type`);
  }

  const openShare = new OpenShare(type, transform);

  // specify if this is a dynamic instance
  if (os.getAttribute('data-open-share-dynamic')) {
    openShare.dynamic = true;
  }

  // specify if this is a popup instance
  if (os.getAttribute('data-open-share-popup')) {
    openShare.popup = true;
  }

  // set all optional attributes on open share instance
  setData(openShare, os);

  // open share dialog on click
  os.addEventListener('click', (e) => {
    share(e, os, openShare);
  });

  os.addEventListener('OpenShare.trigger', (e) => {
    share(e, os, openShare);
  });

  os.setAttribute('data-open-share-node', type);
}
