const OpenShare = {
  share: require('../share.js'),
  count: require('../count.js'),
  analytics: require('../analytics.js'),
};

OpenShare.analytics('tagManager', () => {
  console.log('tag manager loaded');
});

OpenShare.analytics('event', () => {
  console.log('google analytics events loaded');
});

OpenShare.analytics('social', () => {
  console.log('google analytics social loaded');
});

const dynamicNodeData = {
  url: 'http://www.digitalsurgeons.com',
  via: 'digitalsurgeons',
  text: 'Forward Obsessed',
  hashtags: 'forwardobsessed',
  button: 'Open Share Watcher!',
};

function createOpenShareNode(data) {
  const openShare = document.createElement('a');

  openShare.classList.add('open-share-link', 'twitter');
  openShare.setAttribute('data-open-share', 'twitter');
  openShare.setAttribute('data-open-share-url', data.url);
  openShare.setAttribute('data-open-share-via', data.via);
  openShare.setAttribute('data-open-share-text', data.text);
  openShare.setAttribute('data-open-share-hashtags', data.hashtags);
  openShare.innerHTML = `<span class="fa fa-twitter"></span>${data.button}`;

  const node = new OpenShare.share({ //eslint-disable-line
    type: 'twitter',
    url: 'http://www.digitalsurgeons.com',
    via: 'digitalsurgeons',
    hashtags: 'forwardobsessed',
    appendTo: document.querySelector('.open-share-watch'),
    innerHTML: 'Created via OpenShareAPI',
    element: 'div',
    classes: ['wow', 'such', 'classes'],
  });

  return openShare;
}

function addNode() {
  const data = dynamicNodeData;
  document.querySelector('.open-share-watch')
    .appendChild(createOpenShareNode(data));
}

window.addNode = addNode;

function addNodeWithCount() {
  const data = dynamicNodeData; // eslint-disable-line no-unused-vars
  new OpenShare.count({ // eslint-disable-line
    type: 'facebook',
    url: 'https://www.digitalsurgeons.com/',
  }, (node) => {
    const os = new OpenShare.share({ // eslint-disable-line
      type: 'twitter',
      url: 'http://www.digitalsurgeons.com',
      via: 'digitalsurgeons',
      hashtags: 'forwardobsessed',
      innerHTML: 'Created via OpenShareAPI',
      element: 'div',
      classes: ['wow', 'such', 'classes'],
    });
    document.querySelector('.create-node.w-count')
    .appendChild(os);
    os.appendChild(node);
  });
}

window.addNodeWithCount = addNodeWithCount;

function createCountNode() {
  const container = document.querySelector('.create-node.count-nodes');
  const type = container.querySelector('input.count-type').value;
  const url = container.querySelector('input.count-url').value;

  new OpenShare.count({ //eslint-disable-line
    type: type, //eslint-disable-line
    url: url, //eslint-disable-line
    appendTo: container,
    classes: ['test'],
  }, (node) => {
    node.style.position = 'relative';
  });


  container.querySelector('input.count-type').value = '';
  container.querySelector('input.count-url').value = '';
}

window.createCountNode = createCountNode;

// test JS OpenShare API with dashes
new OpenShare.share({ //eslint-disable-line
  type: 'googleMaps',
  center: '40.765819,-73.975866',
  view: 'traffic',
  zoom: 14,
  appendTo: document.body,
  innerHTML: 'Maps',
});

new OpenShare.share({ //eslint-disable-line
  type: 'twitter-follow',
  screenName: 'digitalsurgeons',
  userId: '18189130',
  appendTo: document.body,
  innerHTML: 'Follow Test',
});

// test PayPal
new OpenShare.share({ //eslint-disable-line
  type: 'paypal',
  buttonId: '2P3RJYEFL7Z62',
  sandbox: true,
  appendTo: document.body,
  innerHTML: 'PayPal Test',
});

// bind to count loaded event
document.addEventListener('OpenShare.count-loaded', () => {
  console.log('OpenShare (count) loaded');
});

// bind to share loaded event
document.addEventListener('OpenShare.share-loaded', () => {
  console.log('OpenShare (share) loaded');

  // bind to shared event on each individual node
  [].forEach.call(document.querySelectorAll('[data-open-share]'), (node) => {
    node.addEventListener('OpenShare.shared', (e) => {
      console.log('Open Share Shared', e);
    });
  });

  const examples = { // eslint-disable-line no-unused-vars
    twitter: new OpenShare.share({ //eslint-disable-line
      type: 'twitter',
      bindClick: true,
      url: 'http://digitalsurgeons.com',
      via: 'digitalsurgeons',
      text: 'Digital Surgeons',
      hashtags: 'forwardobsessed',
    }, document.querySelector('[data-api-example="twitter"]')),

    facebook: new OpenShare.share({ //eslint-disable-line
      type: 'facebook',
      bindClick: true,
      link: 'http://digitalsurgeons.com',
      picture: 'http://www.digitalsurgeons.com/img/about/bg_office_team.jpg',
      caption: 'Digital Surgeons',
      description: 'forwardobsessed',
    }, document.querySelector('[data-api-example="facebook"]')),

    pinterest: new OpenShare.share({ //eslint-disable-line
      type: 'pinterest',
      bindClick: true,
      url: 'http://digitalsurgeons.com',
      media: 'http://www.digitalsurgeons.com/img/about/bg_office_team.jpg',
      description: 'Digital Surgeons',
      appendTo: document.body,
    }, document.querySelector('[data-api-example="pinterest"]')),

    email: new OpenShare.share({ //eslint-disable-line
      type: 'email',
      bindClick: true,
      to: 'techroom@digitalsurgeons.com',
      subject: 'Digital Surgeons',
      body: 'Forward Obsessed',
    }, document.querySelector('[data-api-example="email"]')),
  };
});

// Example of listening for counted events on individual urls or arrays of urls
const urls = [
  'facebook',
  'google',
  'linkedin',
  'reddit',
  'pinterest',
  [
    'google',
    'linkedin',
    'reddit',
    'pinterest',
  ],
];

urls.forEach((url) => {
  if (Array.isArray(url)) {
    url = url.join(',');
  }
  const countNode = document.querySelectorAll(`[data-open-share-count="${url}"]`);

  [].forEach.call(countNode, (node) => {
    node.addEventListener(`OpenShare.counted-${url}`, () => {
      const counts = node.innerHTML;
      if (counts) console.log(url, 'shares: ', counts);
    });
  });
});

// test twitter count js api
new OpenShare.count({ //eslint-disable-line
  type: 'twitter',
  url: 'https://www.digitalsurgeons.com/thoughts/technology/the-blockchain-revolution',
  key: 'dstweets',
}, (node) => {
  const os = new OpenShare.share({ //eslint-disable-line
    type: 'twitter',
    url: 'https://www.digitalsurgeons.com/thoughts/technology/the-blockchain-revolution',
    via: 'digitalsurgeons',
    hashtags: 'forwardobsessed, blockchain',
    appendTo: document.body,
    innerHTML: 'BLOCKCHAIN',
  });
  os.appendChild(node);
});
