import Events from '../src/modules/events';
import setData from './setData';

export default function share(e, os, openShare) {
  // if dynamic instance then fetch attributes again in case of updates
  if (openShare.dynamic) {
    setData(openShare, os);
  }

  openShare.share(e);

  // trigger shared event
  Events.trigger(os, 'shared');
}
