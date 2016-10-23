import DataAttr from './modules/data-attr';
import ShareAPI from './modules/share-api';
import Events from './modules/events';
import OpenShare from './modules/open-share';
import ShareTransforms from './modules/share-transforms';
import Count from './modules/count';
import CountAPI from './modules/count-api';
import analyticsAPI from '../analytics';

const browser = () => {
  DataAttr(OpenShare, Count, ShareTransforms, Events);
  window.OpenShare = {
    share: ShareAPI(OpenShare, ShareTransforms, Events),
    count: CountAPI(),
    analytics: analyticsAPI,
  };
};
export default browser();
