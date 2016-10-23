import attr from './modules/data-attr';
import ShareAPI from './modules/share-api';
import CountAPI from './modules/count-api';
import analyticsAPI from '../analytics';

const DataAttr = attr(); // eslint-disable-line

export default {
  share: ShareAPI(),
  count: CountAPI(),
  analytics: analyticsAPI,
};
