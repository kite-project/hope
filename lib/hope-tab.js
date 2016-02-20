/*global fxosComponent, scheduler */
(function() {

var debug = 0 ? (...args) => console.log('[hope-tab]', ...args) : () => {};

const BAR_HEIGHT = 64;
const DEFAULT_THEME = '#56565A';

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
    on(iframe, 'mozbrowsererror', e => this.onError(e));
    on(this.els.close, 'click', e => this.onCloseClick(e));
    on(this.els.form, 'submit', e => this.onSubmit(e));
    on(this.els.refresh, 'click', e => this.refresh(e));
    on(this.els.input, 'focus', e => this.onInputFocus(e));
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

  hasOverrideTheme: function (currentUrl) {
    var theme = null;
    var urls = [
      {match: /^https:\/\/mobile[.]twitter[.]com/, color: '#1da1f2'},
      {match: /^https:\/\/m[.]facebook[.]com/, color: '#3a5795'}
    ];
    urls.forEach(function (url) {
      if (url.match.test(currentUrl.origin)) {
        theme = url.color;
      }
    });
    return theme;
  },

  historyCheck(url) {
    this.pastUrl = this.pastUrl || null;
    var newUrl;
    var override;
    try {
      newUrl = new URL(url);
    } catch (e) {
      // Handle URL parsing error here?
    }
    override = this.hasOverrideTheme(newUrl);

    if (override) {
      this.setTheme(override);
    } else {
      if (this.pastUrl) {
        if (newUrl.origin !== this.pastUrl.origin) {
          this.setTheme(DEFAULT_THEME);
        }
      } else {
        // No prior history so set theme
        this.setTheme(DEFAULT_THEME);
      }
    }
    this.pastUrl = newUrl;
  },

  onError(e) {
    debug('on error', e, this.els.input.value, this.userSubmittedUrl);
    var networkErrors = [
      'certerror',
      'connectionFailure',
      'dnsNotFound'
    ];
    var trimTrailing = function (url) {
      return url.replace(/\/$/, '');
    };

    if (!this.userSubmittedUrl) return;

    var currentUrl = this.sanitizeUrl(this.els.input.value);
    var typedUrl = this.sanitizeUrl(this.userSubmittedUrl);
    var typedUrlObject = new URL(typedUrl);
    debug('Submitted url', this.userSubmittedUrl, typedUrl);

    // Ignore URLs that have not been changed by url sanitising
    if (this.userSubmittedUrl === typedUrl) return;

    debug('networkError', e.detail.type, networkErrors.includes(e.detail.type));
    // Downgrade URL if the user typed it.
    // If the error is one that would happen
    //   when the site doesn't support https
    if (networkErrors.includes(e.detail.type)) {
      debug(
        'looks like a downgrade',
        typedUrlObject.protocol === 'https:',
        trimTrailing(currentUrl),
        trimTrailing(this.userSubmittedUrl)
      );
      // If the typed URL is https and both urls match
      if (
        typedUrlObject.protocol === 'https:'
        && trimTrailing(currentUrl) === trimTrailing(typedUrl)
      ) {
        debug('downgrading http', typedUrl, this.userSubmittedUrl);
        this.url = typedUrl.replace(/^https:/, 'http:');
      }
    }
  },

  onLocationChange(e) {
    debug('location change', e, this.pastUrl);
    this.userSubmittedUrl = null;
    this.setInputValue(e.detail);
    this.historyCheck(e.detail);
  },

  onSubmit(e) {
    e.preventDefault();
    var url = this.els.input.value;
    this.els.input.blur();
    this.userSubmittedUrl = url;
    this.url = url;
  },

  onInputFocus(e) {
    // When the user clicks into the URL bar
    //   all of the text becomes focused and selected
    // Long press on the text should override this event handling
    e.preventDefault();
    this.els.input.focus();
    this.els.input.select();
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
    var safetyTimeout;

    function finish() {
      clearTimeout(safetyTimeout);
      off(iframe, 'mozbrowserloadend', finish);
      defer.resolve();
    }

    // the frame gets 750ms to load
    on(iframe, 'mozbrowserloadend', finish);
    safetyTimeout = setTimeout(finish, 750);

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

  hasValidProtocol(protocol) {
    // This check looks for schemes that appear to be valid
    // Further validation of valid protocols should happen as a follow up task
    // https://html.spec.whatwg.org/multipage/webappapis.html#custom-handlers
    var schemeMatch = /^(^\w+|web\+[a-z]{5,}):/;
    return schemeMatch.test(protocol);
  },

  looksLikeASearch(url) {
    var looksLikeADomain = /[^.]\.[^.]/;

    if (this.hasValidProtocol(url)) {
      return false;
    }
    if (looksLikeADomain.test(url)) {
      return false;
    }
    return true;
  },

  fixedEncodeURIComponent(str) {
    return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
      return '%' + c.charCodeAt(0).toString(16);
    });
  },

  doASearch(string) {
    var search = 'https://duckduckgo.com/?kd=1&q=';
    return search + this.fixedEncodeURIComponent(string);
  },

  sanitizeUrl(url) {
    // Whitelist URL for internal paths
    var matchesAppPath = /^apps\//;
    var outputUrl = (url || '').trim();
    var urlObject;
    if (matchesAppPath.test(url)) {
      return outputUrl;
    }
    try {
      urlObject = new URL(outputUrl);
    } catch (e) {
      if (this.looksLikeASearch(outputUrl)) {
        outputUrl = this.doASearch(outputUrl);
      } else {
        if (!this.hasValidProtocol(outputUrl)) {
          outputUrl = 'https://' + outputUrl;
        }
      }
    }
    return outputUrl;
  },

  activate() {
    this.setAttr('active', '');
    this.els.iframe.setVisible(true);
  },

  deactivate() {
    this.removeAttr('active');
    this.els.input.blur();
    this.els.iframe.setVisible(false);
    this.toggleBar(true);
  },

  attrs: {
    url: {
      get() { return this._url; },
      set(value) {
        if (this.url === value) return;
        var sanitizedValue = this.sanitizeUrl(value);
        this.setAttribute('url', sanitizedValue);
        this.setIframeSrc(sanitizedValue);
        this._url = sanitizedValue;
        debug('set url', sanitizedValue, value);
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
          <iframe mozbrowser="true" remote="true"></iframe>
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
        outline: 0;
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
        background: ${DEFAULT_THEME};
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
        background: var(--tab-background);
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

        background: ${DEFAULT_THEME};
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

        background: ${DEFAULT_THEME};
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
