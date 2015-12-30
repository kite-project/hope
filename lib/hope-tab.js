/*global fxosComponent */
(function() {

var debug = 1 ? (...args) => console.log('[hope-tab]', ...args) : () => {};

const BAR_HEIGHT = 64;

window.HopeTab = fxosComponent.register('hope-tab', {
  created() {
    var shadow = this.setupShadowRoot();

    this.els = {
      bar: shadow.querySelector('.bar'),
      close: shadow.querySelector('.close'),
      title: shadow.querySelector('.title'),
      urlText: shadow.querySelector('.url-text'),
      overlay: shadow.querySelector('.overlay'),
      iframe: shadow.querySelector('iframe')
    };

    this._loaded = new Deferred();
    this.loaded = this._loaded.promise;

    this.updateTitle();
    this.updateTheme();
    this.updateUrl();

    this.els.close.addEventListener('click', e => this.onCloseClick(e));
  },

  onCloseClick(e) {
    debug('close click');
    e.stopPropagation();
    this.dispatch('close-clicked', { bubbles: true });
  },

  dispatch(name, config={}) {
    this.dispatchEvent(new CustomEvent(name, config));
  },

  attrs: {
    url: {
      set(value) {
        if (this.url === value) return;
        this.setAttribute('url', value);
        this.updateUrl();
      },

      get() {
        return this.getAttribute('url');
      }
    },

    title: {
      set(value) {
        if (this.title === value) return;
        this.setAttribute('title', value);
        this.updateTitle();
      },

      get() {
        return this.getAttribute('title');
      }
    },

    themeColor: {
      set(value) {
        if (!value || this.themeColor === value) return;
        this.setAttribute('theme-color', value);
        this.updateTheme();
      },

      get() {
        return this.getAttribute('theme-color') || '#56565A';
      }
    },

    active: {
      get() {
        return this._active;
      },

      set(value) {
        value = value || value === '';
        if (value === this._active) return;
        this._active = value;
        if (value) this.setAttr('active', '');
        else this.removeAttr('active');
      }
    }
  },

  updateTitle() {
    if (!this.title) return;
    this.els.title.textContent = this.title;
    debug('updated title', this.title);
  },

  updateUrl() {
    if (!this.url) return;
    var html = `<base href="${location.href}"><style>body{margin:0}</style>
    <img style="width:100%" src="assets/${this.url}.png"/>`;
    this.els.iframe.src = 'data:text/html;charset=utf-8,' + encodeURI(html);
    this.els.iframe.onload = this._loaded.resolve;
    this.els.urlText.textContent = this.url;
    debug('updated image', this.url);
  },

  updateTheme() {
    if (!this.themeColor) return;
    this.els.bar.style.backgroundColor = this.themeColor;
    this.els.overlay.style.backgroundColor = this.themeColor;
    debug('updated theme', this.themeColor);
  },

  /*jshint ignore:start*/
  template: `
    <div class="inner">
      <div class="bar">
        <div class="tab">
          <h3 class="title"></h3>
          <button class="close" data-icon="close"></button>
        </div>
        <div class="url">
          <div class="field">
            <button class="reader"></button>
            <div class="url-text"></div>
            <button class="refresh"></button>
          </div>
        </div>
      </div>
      <div class="content">
        <iframe></iframe>
        <div class="overlay"></div>
      </div>
    </div>
    <style>
      :host {
        display: block;
        overflow: hidden;
      }

      button {
        padding: 0;
        border: 0;
        color: inherit;
        background: none;
        border-radius: 0;
      }

      [data-icon]:before {
        font-family: fxos-icons;
        content: attr(data-icon);
        display: inline-block;
        font-weight: 500;
        text-align: center;
        text-rendering: optimizeLegibility;
      }

      .inner {
        position: relative;
        height: 100%;
      }

      .bar {
        position: relative;
        height: ${BAR_HEIGHT}px;

        line-height: ${BAR_HEIGHT}px;
        background: #56565A;
        color: white;
      }

      .bar .tab {
        display: flex;
        align-items: center;
      }

      .bar .title {
        flex: 1;
        margin: 0;
        padding: 0 16px;
        overflow: hidden;

        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: 18px;
        font-weight: normal;
        text-shadow: 0 1px 0 rgba(0,0,0,0.15);
        pointer-events: none;
      }

      .bar .close {
        height: ${BAR_HEIGHT}px;
        padding: 0 8px;

        font-size: 32px;
        transition: opacity 200ms ease-in;
      }

      .url {
        position: absolute;
        top: 0;
        left: 0;
        z-index: 500;

        width: 100%;
        height: 100%;
        padding: 8px;
        box-sizing: border-box;
        overflow: hidden;

        opacity: 0;
        visibility: hidden;
        background: #333;
        transition:
          opacity 250ms ease-in,
          visibility 250ms ease-in;
      }

      [active] .url {
        opacity: 1;
        visibility: visible;
      }

      .url .field {
        position: relative;
        display: flex;
        align-items: center;
        height: 100%;
        background: rgba(255,255,255,0.05);
      }

      .url .field .reader,
      .url .field .refresh {
        width: 16px;
        height: 16px;
        background-size: 100%;
        background-position: center;
        background-repeat: no-repeat;
        background-clip: padding-box;
        border: solid 12px transparent;
        box-sizing: content-box;
      }

      .url .field .reader {
        background-image: url(assets/urlbar_reader_mode_icon.png);
      }

      .url .field .refresh {
        background-image: url(assets/urlbar_refresh_icon.png);
      }

      .url .url-text {
        display: block;
        flex: 1;
        overflow: hidden;

        white-space: nowrap;
        text-overflow: ellipsis;
        line-height: 52px;
        text-align: center;
        font-size: 18px;
        font-weight: 400;
        color: white;
        opacity: 1;

        transition-duration: 300ms;
        transition-timing-function: ease-in;
        transition-property: opacity;
      }

      .content {
        position: absolute;
        top: ${BAR_HEIGHT}px;
        bottom: 0;
        left: 0;
        right: 0;
      }

      iframe {
        width: 100%;
        height: 100%;
        border: 0;
      }

      .overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;

        opacity: 0.5;
        transition: opacity 250ms ease-in, visibility 250ms ease-in;
        visibility: visible;
      }

      [active] .overlay {
        opacity: 0;
        visibility: hidden;
      }
    </style>`
    /*jshint ignore:end*/
});

window.HopeTab.BAR_HEIGHT = BAR_HEIGHT;

function Deferred() {
  this.promise = new Promise((resolve, reject) => {
    this.resolve = resolve;
    this.reject = reject;
  });
}

})();
