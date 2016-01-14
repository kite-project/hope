/*global fxosComponent, scheduler */
(function() {

var debug = 0 ? (...args) => console.log('[hope-tab]', ...args) : () => {};

const BAR_HEIGHT = 64;

window.HopeTab = fxosComponent.register('hope-tab', {
  created() {
    var shadow = this.setupShadowRoot();
    var iframe = shadow.querySelector('iframe');

    this.els = {
      content: shadow.querySelector('.content'),
      bar: shadow.querySelector('.bar'),
      close: shadow.querySelector('.close'),
      title: shadow.querySelector('.title'),
      form: shadow.querySelector('form'),
      input: shadow.querySelector('input'),
      overlay: shadow.querySelector('.overlay'),
      tab: shadow.querySelector('.tab'),
      refresh: shadow.querySelector('.refresh'),
      iframe: iframe
    };

    this.url = this.getAttribute('url');
    this.lastScrollTime = Date.now();
    this.scrollPosition = 0;

    scheduler.attachDirect(iframe, 'mozbrowserscroll',
      e => this.onIframeScroll(e));

    on(iframe, 'mozbrowserlocationchange', e => this.onLocationChange(e));
    on(iframe, 'mozbrowsertitlechange', e => this.onTitleChange(e));
    on(iframe, 'mozbrowsermetachange', e => this.onMetaChange(e));
    on(this.els.close, 'click', e => this.onCloseClick(e));
    on(this.els.form, 'submit', e => this.onSubmit(e));
    on(this.els.refresh, 'click', e => this.refresh(e));
  },

  onCloseClick(e) {
    debug('close click');
    e.stopPropagation();
    this.dispatch('closeclicked', { bubbles: true });
  },

  onTitleChange(e) {
    debug('on title change', e);
    this.setTitle(e.detail);
  },

  onMetaChange(e) {
    debug('on meta change', e);
    var meta = e.detail;

    switch (meta.name) {
      case 'theme-color': this.setTheme(meta.content); break;
    }
  },

  onLocationChange(e) {
    debug('location change', e);
    this.setInputValue(e.detail);
  },

  onSubmit(e) {
    e.preventDefault();
    var url = this.els.input.value;
    this.els.input.blur();
    this.url = url;
  },

  onIframeScroll(e) {
    var position = e.detail.top;
    var delta = position - this.scrollPosition;
    var moved = Math.abs(delta);
    var time = Date.now() - this.lastScrollTime;
    var speed = Math.round((moved / time) * 100);
    var significant = moved > 90 && speed > 80;
    var atTop = position === 0;
    var down = delta > 0;
    var up = !down;

    if (!moved) return;
    else if (atTop) this.toggleBar(true);
    else if (down) this.toggleBar(false);
    else if (up && significant) this.toggleBar(true);

    this.scrollPosition = position;
    this.lastScrollTime = Date.now();
    debug('scrolled', delta, speed);
  },

  toggleBar(show) {
    var scrollTop = this.els.content.scrollTop;
    var hidden = scrollTop  === BAR_HEIGHT;
    var shown = scrollTop  === 0;

    if (show && shown) {
      debug('already shown');
      return Promise.resolve();
    }

    if (!show && hidden) {
      debug('already hidden');
      return Promise.resolve();
    }

    debug('toggling bar...', show);

    if (this.barToggling) {
      debug('queue value', show);
      this.pendingToggleValue = show;
      return this.barToggling;
    }

    var top = show ? 0 : BAR_HEIGHT;

    return this.barToggling = smoothScroll(this.els.content, top)
      .then(() => {
        debug('toggle complete', show);
        delete this.barToggling;

        if (this.pendingToggleValue) {
          var value = this.pendingToggleValue;
          delete this.pendingToggleValue;
          return this.toggleBar(value);
        }
      });
  },

  refresh() {
    debug('refresh');
    this.els.iframe.reload();
  },

  loaded() {
    var defer = new Deferred();
    var iframe = this.els.iframe;

    on(iframe, 'load', function fn() {
      off(iframe, 'load', fn);
      defer.resolve();
    });

    return defer.promise;
  },

  dispatch(name, config={}) {
    this.dispatchEvent(new CustomEvent(name, config));
  },

  setTitle(value) {
    if (!value) return;
    scheduler.mutation(() => {
      this.els.title.textContent = value;
      this.title = value;
      debug('set title', value);
    });
  },

  setIframeSrc(src) {
    if (!src) return;
    this.els.iframe.src = src;
    debug('set iframe src', src);
  },

  setInputValue(url) {
    this.els.input.value = url;
  },

  setTheme(value) {
    scheduler.mutation(() => {
      value = value || '';
      this.els.bar.style.backgroundColor = value;
      this.els.overlay.style.backgroundColor = value;
      this.els.tab.style.backgroundColor = value;
      this.style.backgroundColor = value;
      debug('set theme', value);
    });
  },

  activate() {
    this.setAttr('active', '');
    this.els.iframe.setVisible(true);
  },

  deactivate() {
    this.removeAttr('active');
    this.els.iframe.setVisible(false);
    this.toggleBar(true);
  },

  attrs: {
    url: {
      get() { return this._url; },
      set(value) {
        if (this.url === value) return;
        this.setAttribute('url', value);
        this.setIframeSrc(value);
        this._url = value;
        debug('set url', value);
      }
    },

    active: {
      get() { return this._active; },
      set(value) {
        value = value || value === '';
        if (value === this._active) return;
        this._active = value;
        if (value) this.activate();
        else this.deactivate();
      }
    }
  },

  /*jshint ignore:start*/
  template: `
    <div class="inner">
      <div class="content no-scrollbar">
        <div class="bar">
          <div class="url">
            <form class="field">
              <button class="reader" data-icon="readermode"></button>
              <div class="input">
                <input type="search" x-inputmode="verbatim"/>
              </div>
              <button class="refresh" data-icon="reload"></button>
            </form>
          </div>
        </div>
        <div class="browser">
          <iframe mozbrowser remote></iframe>
        </div>
      </div>
      <div class="overlay"></div>
      <div class="tab">
        <h3 class="title"></h3>
        <button class="close" data-icon="close"></button>
      </div>
    </div>
    <style>
      :host {
        display: block;
        overflow: hidden;
        color: white;
      }

      .no-scrollbar {
        width: 100%;
        padding-right: 20px;
        overflow-x: hidden;
        overflow-y: scroll;
      }

      button,
      form {
        margin: 0;
        padding: 0;
        border: 0;
        color: inherit;
        background: none;
        border-radius: 0;
      }

      [data-icon]:before {
        font-family: kite-icons;
        content: attr(data-icon);
        display: inline-block;
        font-size: inherit;
        font-weight: 500;
        text-align: center;
        text-rendering: optimizeLegibility;
      }

      .inner {
        position: relative;
        height: 100%;
      }

      .content {
        position: relative;
        height: 100%;
      }

      .bar {
        position: relative;
        height: ${BAR_HEIGHT}px;

        line-height: ${BAR_HEIGHT}px;
        background: #56565A;
      }

      .url {
        position: absolute;
        top: 0;
        left: 0;

        width: 100%;
        height: 100%;
        padding: 8px;
        box-sizing: border-box;
        overflow: hidden;
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
        width: 1em;
        height: 1em;
        font-size: 17px;
        background-size: 100%;
        background-position: center;
        background-repeat: no-repeat;
        background-clip: padding-box;
        border: solid 12px transparent;
        box-sizing: content-box;
      }

      .url .input {
        display: block;
        flex: 1;
        opacity: 1;
      }

      .url .input input {
        box-sizing: border-box;
        border: 0;
        margin: 0;
        padding: 0;
        width: 100%;

        text-align: center;
        font-size: 18px;
        font-weight: 400;

        color: white;
        background: none;
      }

      .browser {
        position: relative;
        height: 100%;
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

        background: #56565A;
        visibility: visible;
        opacity: 0.5;

        transition:
          opacity 250ms ease-in,
          visibility 250ms ease-in;
      }

      [active] .overlay {
        opacity: 0;
        visibility: hidden;
      }

      .tab {
        position: absolute;
        top: 0;
        left: 0;

        display: flex;
        align-items: center;
        width: 100%;
        height: ${BAR_HEIGHT}px;

        background: #56565A;
        visibility: visible;
        opacity: 1;

        transition:
          opacity 250ms ease-in,
          visibility 250ms ease-in;
      }

      [active] .tab {
        opacity: 0;
        visibility: hidden;
      }

      .tab .title {
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

      .tab .close {
        height: ${BAR_HEIGHT}px;
        padding: 0 8px;
        font-size: 23px;
      }
    </style>`
    /*jshint ignore:end*/
});

window.HopeTab.BAR_HEIGHT = BAR_HEIGHT;

/**
 * Utils
 */

function Deferred() {
  this.promise = new Promise((resolve, reject) => {
    this.resolve = resolve;
    this.reject = reject;
  });
}

function smoothScroll(el, top) {
  debug('smooth scroll', top, el.scrollTop);
  return new Promise(resolve => {
    var fallbackTimeout;
    var scrollTimeout;

    if (el.scrollTop === top) return resolve();

    el.scrollTo({
      top: top,
      behavior: 'smooth'
    });

    // catch no 'scroll' corner cases
    fallbackTimeout = setTimeout(complete, 500);

    on(el, 'scroll', onScroll);

    function onScroll() {
      clearTimeout(fallbackTimeout);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(complete, 300);
    }

    function complete() {
      clearTimeout(scrollTimeout);
      clearTimeout(fallbackTimeout);
      off(el, 'scroll', onScroll);
      var delta = Math.abs(el.scrollTop - top);
      if (delta <= 1) resolve();
      else resolve(smoothScroll(el, top));
    }
  });
}

function on(el, name, fn) { el.addEventListener(name, fn); }
function off(el, name, fn) { el.removeEventListener(name, fn); }

})();
