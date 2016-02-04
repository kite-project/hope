/*global fxosComponent */
(function() {

var debug = 0 ? (...args) => console.log('[hope-app-link]', ...args) : () => {};

fxosComponent.register('hope-app-link', {
  created() {
    var shadow = this.setupShadowRoot();

    this.els = {
      inner: shadow.querySelector('.inner'),
      title: shadow.querySelector('.title'),
      image: shadow.querySelector('img'),
    };

    this.apps = {
      contacts: {
        icon: 'assets/contacts.png',
        text: 'Contacts',
        url: 'https://example.com'
      },
      'the-verge': {
        icon: 'assets/the-verge.png',
        text: 'The Verge',
        url: 'http://www.theverge.com/'
      },
      'team-liquid': {
        icon: 'assets/team-liquid.png',
        text: 'Team Liquid',
        url: 'http://www.teamliquid.net/'
      },
      'vine': {
        icon: 'assets/vine.png',
        text: 'Vine',
        url: 'https://vine.co/'
      },
      'camera': {
        icon: 'assets/camera.png',
        text: 'Camera',
        url: 'https://example.com'
      },
      'new-york-times': {
        icon: 'assets/nyt.png',
        text: 'New York Times',
        url: 'http://www.nytimes.com/'
      },
      'wired': {
        icon: 'assets/wired.png',
        text: 'Wired',
        url: 'http://www.wired.com/'
      },
      'bbc-news': {
        icon: 'assets/bbc.png',
        text: 'BBC News',
        url: 'http://news.bbc.co.uk/'
      },
      'huffington-post': {
        icon: 'assets/huff.png',
        text: 'Huffington Post',
        url: 'http://www.huffingtonpost.co.uk/'
      },
      'marketplace': {
        icon: 'assets/marketplace.png',
        text: 'Marketplace',
        url: 'https://marketplace.firefox.com/'
      },
      'kotaku': {
        icon: 'assets/kotaku.png',
        text: 'Kotaku',
        url: 'http://kotaku.com/'
      },
      'squarespace': {
        icon: 'assets/ss.png',
        text: 'Squarespace',
        url: 'https://www.squarespace.com/'
      }
    };
    this.app = this.apps[this.getAttribute('app')];

    this.els.image.setAttribute('src', this.app.icon);
    this.els.image.setAttribute('alt', this.app.text);
    this.els.title.innerText = this.app.text;


    on(this.els.inner, 'click', e => this.onClick(e));
  },

  onClick() {
    debug('Clicked', this.app);
    window.location = this.app.url;
  },


  /*jshint ignore:start*/
  template: `
    <div class="inner">
      <img />
      <div class="title"></div>
    </div>
    <style>
      :host {
        display: block;
        overflow: hidden;
        text-align: center;
      }
      img {
        margin: auto;
        width: 100%;
      }
      .title {
        margin: 2px 0 0 0;
        font-size: 11px;
      }
    </style>`
    /*jshint ignore:end*/
});

/**
 * Utils
 */

function on(el, name, fn) { el.addEventListener(name, fn); }

})();
