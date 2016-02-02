/*global fxosComponent, HopeTab, scheduler */
(function() {

var debug = 0 ? (...args) => console.log('[hope-tab-list]', ...args) : () => {};

const BAR_HEIGHT = HopeTab.BAR_HEIGHT;
const PREVIEW_HEIGHT = 88;
const GUTTER_HEIGHT = 8;
const TAB_HEIGHT = GUTTER_HEIGHT + BAR_HEIGHT + PREVIEW_HEIGHT;

fxosComponent.register('hope-tab-list', {
  created() {
    var shadow = this.setupShadowRoot();

    this.els = {
      inner: shadow.querySelector('.inner'),
      container: shadow.querySelector('.container'),
      grippy: shadow.querySelector('.grippy'),
      add: shadow.querySelector('.add'),
      tabs: Array.from(this.querySelectorAll('li'))
    };

    this.onScroll = this.onScroll.bind(this);
    this.selecting = false;
    this.opening = false;
    this.closing = false;
    this.inTabsView = false;

    // Events
    on(this.els.container, 'closeclicked', e => this.onClose(e));
    on(this.els.container, 'click', e => this.onClick(e));
    on(this.els.add, 'click', e => this.onAddClick(e));

    this.observeScroll();
    this.setupSnapping();

    // Layout when decendants are ready
    this.rendered = new Deferred();
    setTimeout(() => this.layout().then(() => {
      this.rendered.resolve();
    }));
  },

  onClick(e) {
    if (!this.inTabsView) return;
    var tab = e.target.closest('li');
    if (tab) this.select(tab);
  },

  onClose(e) {
    var tab = e.target.closest('li');
    this.close(tab);
  },

  /**
   * We use the DomScheduler to observe the scrolling while protecting it from
   * mutations.
   *
   * But, optionally, if the browser supports the |scrollend| event, we stop
   * protecting (and flush the scheduler's queue) as soon as the |scrollend|
   * comes in.
   *
   * Otherwise the DomScheduler's default "protection window" will apply.
   *
   * @private
   */
  observeScroll() {
    scheduler.attachDirect(this.els.inner, 'scroll', this.onScroll);
    this.els.inner.addEventListener('scrollend', (evt) => {
      // Will flush the scheduler's queue
      scheduler.detachDirect(this.els.inner, 'scroll', this.onScroll);

      setTimeout(() => {
        scheduler.attachDirect(this.els.inner, 'scroll', this.onScroll);
      });
    });

    // init
    this.onScroll();
  },

  onScroll() {
    var height = window.innerHeight;
    var previous = this.scrollPosition;
    var current = this.getScrollTop();
    var entering = current > previous && current >= height / 2;
    var leaving = current < previous && current <= height / 2;

    if (entering) this.onEnterTabs();
    if (leaving) this.onLeaveTabs();

    this.scrollPosition = current;
  },

  onEnterTabs() {
    if (this.inTabsView) return;
    this.inTabsView = true;
    debug('enter tabs');

    var current = this.els.tabs[0];
    if (!current) return;

    scheduler.feedback(() => {
      this.els.grippy.style.opacity = 0;
      current.firstElementChild.active = false;
      this.els.add.classList.add('show');
    }, current, 'transitionend');
  },

  onLeaveTabs() {
    if (!this.inTabsView) return;
    this.inTabsView = false;
    debug('leave tabs');

    var current = this.els.tabs[0];
    if (!current) return;

    scheduler.feedback(() => {
      this.els.grippy.style.opacity = '';
      current.firstElementChild.active = true;
      this.els.add.classList.remove('show');
    }, current, 'transitionend');
  },

  onAddClick() {
    this.open('apps/homescreen/index.html');
  },

  getSnapHeight() {
    return window.innerHeight - TAB_HEIGHT;
  },

  getTabHeight() {
    return Math.max(
      TAB_HEIGHT,
      (this.getSnapHeight() + GUTTER_HEIGHT) / (this.els.tabs.length - 1)
    );
  },

  getScrollTop() {
    return this.els.inner.scrollTop;
  },

  scrollTo(top, options={}) {
    return new Promise(resolve => {
      var safetyTimeout;
      var self = this;

      function finish() {
        clearTimeout(safetyTimeout);
        self.els.inner.removeEventListener('scrollend', finish);

        resolve();
      }

      if (!options.instant) {
        safetyTimeout = setTimeout(finish, options.wait || 300);
        self.els.inner.addEventListener('scrollend', finish);
      }

      this.els.inner.scrollTo({
        top: top,
        behavior: options.instant ? 'auto' : 'smooth'
      });

      if (options.instant) resolve();
    });
  },

  setupSnapping() {
    var snapHeight = this.getSnapHeight();
    this.els.inner.style.scrollSnapPointsY = `repeat(${snapHeight}px)`;
  },

  layout() {
    return new Promise(resolve => {
      debug('layout');

      var current = this.els.tabs[0];
      var content = current.querySelector('hope-tab');
      var snapHeight = this.getSnapHeight();
      var container = this.els.container;

      this.cleanUp(current);

      content.active = !this.inTabsView;

      current.classList.add('current');
      current.style.height = `calc(100vh + ${snapHeight}px)`;
      current.style.zIndex = 1;
      current.style.top = 0;

      var tabs = this.els.tabs.slice(1);
      var tabHeight = this.getTabHeight();
      var top = window.innerHeight - GUTTER_HEIGHT;

      for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];

        tab.style.height = tabHeight + 'px';
        tab.style.top = top + 'px';
        tab.style.zIndex = i + 2;

        top += tabHeight;
        this.cleanUp(tab);
      }

      var newHeight = Math.max(snapHeight * 2, top);
      var scrollTop = this.getScrollTop();

      if ((scrollTop + window.innerHeight) < newHeight) {
        updateContainer();
        return;
      }

      var newPosition = scrollTop - this.getTabHeight();

      // not enough tabs to scroll past the initial snap
      if (newHeight == (snapHeight * 2) + TAB_HEIGHT) {
        newPosition = snapHeight;
      }

      this.scrollTo(newPosition)
        .then(updateContainer);

      function updateContainer() {
        container.style.height = newHeight + 'px';
        // we always want layout to be async
        setTimeout(resolve);
      }
    });
  },

  preLayout() {
    // Letting the tabs grow to their size after the change
    // if needed.
    var tabs = this.els.tabs.slice(1);
    var tabHeight = this.getTabHeight();
    var top = window.innerHeight - GUTTER_HEIGHT;

    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      tab.style.height = tabHeight + 'px';
      tab.dataset.nextTop = top;
      tab.style.transition = 'transform 200ms ease-in var(--motion-delay)';

      top += tabHeight;
    }
  },

  open(options) {
    if (this.opening) return;
    if (this.selecting) return;
    if (this.closing) return;
    this.opening = true;
    debug('open');

    var snapHeight = this.getSnapHeight();
    var tab = this.create(options);
    var hopeTab = tab.firstElementChild;

    tab.style.top = snapHeight - GUTTER_HEIGHT + 'px';
    tab.style.height = window.innerHeight + 'px';
    tab.style.zIndex = 0;

    scheduler.mutation(() => {
      debug('attaching new tab');
      var previous = this.els.tabs[0];
      var content = previous.firstElementChild;

      this.insertBefore(tab, previous);
      this.els.tabs.unshift(tab);

      content.active = false;
      previous.classList.remove('current');
      previous.style.top = snapHeight - GUTTER_HEIGHT + 'px';
      previous.style.height = snapHeight + 'px';
    })

      // Load the new tab page while we're scrolling
      .then(() => Promise.all([this.showFirstTab(), hopeTab.loaded()]))

      .then(() => {
        var motions = [];

        motions.push(scheduler.transition(() => {
          tab.classList.add('will-open');
        }, tab, 'animationend'));

        var tabsAfter = this.els.tabs.slice(1);
        tabsAfter.forEach(el => {
          motions.push(scheduler.transition(() => {
            debug('moving tabs down');
            el.classList.add('move-down');
          }, el, 'animationend'));
        });

        return Promise.all(motions);
      })

      .then(() => scheduler.mutation(() => this.layout()))
      .then(() => this.scrollTo(0))
      .then(() => this.opening = false);
  },

  close(tab) {
    if (this.closing) return;

    // Always keep at least 2 tabs
    if (this.els.tabs.length == 2) {
      scheduler.transition(() => {
        tab.classList.add('shake');
      }, tab, 'animationend').then(() => {
        tab.classList.remove('shake');
      });
      return;
    }

    if (this.selecting) return;
    if (this.opening) return;

    debug('close', tab);
    this.closing = true;

    var tabIndex = this.els.tabs.indexOf(tab);
    var tabsAfter = this.els.tabs.slice(tabIndex + 1);
    var motions = [];

    this.els.tabs.splice(tabIndex, 1);

    scheduler.mutation(() => {
      this.preLayout();
    })

    .then(() => {
      motions.push(scheduler.transition(() => {
        tab.classList.add('will-close');
      }, tab, 'animationend'));

      tabsAfter.forEach(el => {
        var delta = parseInt(el.dataset.nextTop) - parseInt(el.style.top);
        if (delta === 0) return;

        motions.push(
          scheduler.transition(() => {
            el.style.transform = `translateY(${delta}px)`;
          }, el, 'transitionend', 1000) // has a delay
        );
      });

      // The tabs might grow and we need to 'reveal' them
      if (this.els.tabs.length <= 3) {
        tab.classList.add('reveal');
      }

      return Promise.all(motions);
    })

    .then(() => {
      return scheduler.mutation(() => {
        tab.remove();
        return this.layout();
      });
    })

    .then(() => {
      if (this.els.tabs.length === 1) this.select(this.els.tabs[0]);
      this.closing = false;
    });
  },

  select(tab) {
    if (this.selecting) return Promise.reject();
    if (this.opening) return Promise.reject();
    if (this.closing) return Promise.reject();

    debug('select', tab);
    this.selecting = true;

    var previous = this.els.tabs[0];
    var tabIndex = this.els.tabs.indexOf(tab);
    var toMoveUp = this.els.tabs.slice(0, tabIndex);
    var tabsAfter = this.els.tabs.slice(tabIndex + 1);
    var snapHeight = this.getSnapHeight();

    return scheduler.mutation(() => {
      var content = previous.firstElementChild;

      content.active = false;
      previous.classList.remove('current');
      previous.style.top = snapHeight - GUTTER_HEIGHT + 'px';

      tab.style.height = window.innerHeight + 'px';
      tab.style.transition = 'transform 200ms ease-in';

      toMoveUp.forEach(el => {
        el.style.height = this.getTabHeight() + 'px';
        el.style.transition = 'transform 200ms ease-in';
      });
    })

    .then(() => {
      var top = toMoveUp.length && toMoveUp[toMoveUp.length - 1];
      var bottom = tabsAfter.length && tabsAfter[0];
      var feedbacks = [];

      feedbacks.push(
        scheduler.transition(() => {
          tab.classList.add('shrink-middle');
        }, tab, 'animationend')

        .then(() => {
          tab.classList.remove('shrink-middle');
        })
      );

      if (top) {
        feedbacks.push(
          scheduler.transition(() => {
            top.classList.add('shrink-top');
          }, top, 'animationend')

          .then(() => {
            top.classList.remove('shrink-top');
          })
        );
      }

      if (bottom) {
        feedbacks.push(
          scheduler.transition(() => {
            bottom.classList.add('shrink-bottom');
          }, bottom, 'animationend')

          .then(() => {
            bottom.classList.remove('shrink-bottom');
          })
        );
      }

      this.els.tabs.splice(tabIndex, 1);
      this.els.tabs.unshift(tab);

      return Promise.all(feedbacks);
    })

    .then(() => {
      var top = parseInt(tab.style.top) + GUTTER_HEIGHT;
      var translate = - (top - this.getScrollTop());
      var motions = [];

      // Slide the selected tab up
      // to the top of the viewport
      motions.push(scheduler.transition(() => {
        debug('slide up', translate);
        tab.style.transform = `translateY(${translate}px)`;
      }, tab, 'transitionend'));

      // Slide tabs above the selected
      // tab up the same amount so that
      // they appear to slide together
      toMoveUp.forEach(el => {
        motions.push(scheduler.transition(() => {
          el.style.transform = `translateY(${translate}px)`;
        }, el, 'transitionend'));
      });

      // Slide all tabs after the selected
      // tab down out of the viewport
      tabsAfter.forEach(el => {
        motions.push(scheduler.transition(() => {
          el.classList.add('hide-down');
        }, el, 'animationend'));
      });

      return Promise.all(motions);
    })

    .then(() => {
      return scheduler.mutation(() => {
        tab.style.removeProperty('transition');
        tab.style.removeProperty('transform');

        toMoveUp.forEach(tab => {
          tab.style.removeProperty('transition');
          tab.style.removeProperty('transform');
        });

        this.scrollTo(0, { instant: true });
        return this.layout();
      });
    })

    .then(() => {
      this.selecting = false;
    });
  },

  create(url) {
    debug('create', url);
    var li = document.createElement('li');
    var tab = document.createElement('hope-tab');

    tab.url = url;
    li.appendChild(tab);

    return li;
  },

  showFirstTab() {
    debug('show first tab');
    var snapHeight = this.getSnapHeight();
    var scrollTop = this.getScrollTop();

    if (scrollTop <= snapHeight) return Promise.resolve();
    return this.scrollTo(snapHeight);
  },

  showCurrent() {
    return this.scrollTo(0);
  },

  cleanUp(tab) {
    debug('clean up');
    tab.classList.remove('current');
    tab.classList.remove('move-down');
    tab.classList.remove('hide-up');
    tab.classList.remove('hide-down');
    tab.classList.remove('will-open');
    tab.classList.remove('will-close');
    tab.classList.remove('will-select');
    tab.classList.remove('reveal');
    tab.classList.remove('in-tabs-view');
    tab.style.transition = '';
    tab.style.transform = '';
    tab.dataset.nextTop = '';
  },

  dispatch(name, config={}) {
    this.dispatchEvent(new CustomEvent(name, config));
  },

  /*jshint ignore:start*/
  template: `
    <div class="inner no-scrollbar single-viewport">
      <div class="container scrollable double-viewport">
        <div class="grippy"></div>
        <content></content>
      </div>
    </div>
    <button class="add"></button>
    <style>
      :host {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;

        display: block;
        background: #333;
      }

      .no-scrollbar {
        width: 100%;
        padding-right: var(--scrollbar-width);
        overflow-y: scroll;
        overflow-x: hidden;
      }

      .no-scrollbar > .scrollable {
        position: absolute;
        top: 0;
        left: 0;
        width: calc(100% - var(--scrollbar-width));
      }

      .single-viewport {
        height: 100vh;
      }

      .double-viewport {
        height: 200vh;
      }

      .inner {
        position: absolute;
        top: 0;
        left: 0;

        scroll-snap-type: mandatory;
        scroll-snap-destination: 50% 0;
      }

      .grippy {
        position: absolute;
        left: 0;
        top: calc(100vh - 40px);
        z-index: 1000;

        width: 100%;
        height: 8px;
        border-top: solid 32px transparent;
        text-align: center;
        font-size: 0;

        transition: opacity 150ms linear;
        background-color: #333;
        background-clip: content-box;
      }

      .grippy:before {
        content: '';
        display: inline-block;
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-bottom: 8px solid #c5c5c5;
      }

      ::content li {
        position: absolute;
        left: 0;

        width: 100%;
        list-style-type: none;
        animation-duration: var(--motion-duration);
        animation-timing-function: ease-in;
        animation-fill-mode: both;
        overflow: hidden;

        -moz-user-select: none;
        opacity: 1;
        transition: opacity 0.2s linear;
      }

      ::content li.will-close.reveal {
        opacity: 0;
      }

      ::content li.will-close > hope-tab {
        animation-name: will-close;
      }

      ::content li:not(.current) {
        background: #333;
        border-top: var(--tab-gutter-height) #333 solid;
        transform: translate(0,0);
        scroll-snap-coordinate: 50% var(--tab-gutter-height);
      }

      ::content li.current {
        overflow: visible; /* for sticky */
      }

      ::content li.will-open hope-tab {
        transform-origin: 50% top;
        animation-timing-function: var(--elastic-function);
        animation-name: will-open;
      }

      ::content li.shake hope-tab {
        animation-duration: var(--motion-duration);
        animation-name: shake;
      }

      ::content li.move-down {
        animation-timing-function: var(--elastic-function);
        animation-name: move-down;
      }

      ::content li.hide-down {
        animation-name: hide-down;
      }

      ::content li hope-tab {
        height: 100vh;

        animation-duration: var(--motion-duration);
        animation-timing-function: ease-in;
        animation-fill-mode: both;
      }

      ::content li.current hope-tab {
        position: sticky;
        top: 0;
      }

      ::content li.shrink-middle > hope-tab {
        animation-duration: var(--motion-delay);
        transform-origin: 50% calc((var(--actionbar-height) + var(--preview-height)) / 2);
        animation-name: shrink-and-bounce;
      }

      ::content li.shrink-top > hope-tab {
        animation-duration: var(--motion-delay);
        transform-origin: 50% top;
        animation-name: shrink-and-bounce;
      }

      ::content li.shrink-bottom > hope-tab {
        animation-duration: var(--motion-delay);
        transform-origin: 50% bottom;
        animation-name: shrink-and-bounce;
      }

      .add {
        position: fixed;
        left: calc(50% - 32px);
        bottom: 64px;
        z-index: 100;

        display: block;
        width: 64px;
        height: 64px;
        border: 0;
        border-radius: 50%;
        line-height: 60px;
        text-align: center;

        color: #c5c5c5;
        background: #222;
        animation-duration: 300ms;
        animation-timing-function: ease-in;
        animation-fill-mode: both;
        animation-name: hide-add;

        -moz-user-select: none;
      }

      .add:before {
        content: '+';
        font-size: 60px;
        font-weight: 500;
      }

      .add.show {
        animation-name: show-add;
      }
    </style>`,

    globalCss: `
      @keyframes will-close {
        0% {
          opacity: 1;
          transform: scale(1);
        }

        25% {
          opacity: 1;
          transform: scale(0.95);
        }

        50% {
          transform: scale(1);
        }

        100% {
          opacity: 0;
          transform: scale(1);
        }
      }

      @keyframes will-open {
        0% { transform: scale(0.5) }
        100% { transform: scale(1) }
      }

      @keyframes shake {
        0% { transform: translateX(0) }
        25% { transform: translateX(-20px) }
        50% { transform: translateX(0) }
        75% { transform: translateX(20px) }
        100% { transform: translateX(0) }
      }

      @keyframes move-down {
        from { transform: translateY(0) }
        to {
          transform: translateY(calc(var(--actionbar-height) + var(--preview-height)));
        }
      }

      @keyframes hide-down {
        from { transform: translateY(0) }
        to { transform: translateY(100vh) }
      }

      @keyframes shrink-and-bounce {
        from { transform: scale(1) }
        50% { transform: scale(0.95) }
        to { transform: scale(1) }
      }

      @keyframes show-add {
        from {
          opacity: 0;
          transform: translateY(150px) rotate(180deg);
        }

        to {
          opacity: 1;
          transform: translateY(0) rotate(0deg);
        }
      }

      @keyframes hide-add {
        from {
          opacity: 1;
          transform: translateY(0) rotate(0deg);
        }

        50% {
          opacity: 1;
          transform: translateY(0) rotate(90deg);
        }

        to {
          opacity: 0;
          transform: translateY(150px) rotate(180deg);
        }
      }`
    /*jshint ignore:end*/
});

/**
 * Utils
 */

function on(el, name, fn) { el.addEventListener(name, fn); }
/*function off(el, name, fn) { el.removeEventListener(name, fn); }*/

function Deferred() {
  this.promise = new Promise((resolve, reject) => {
    this.resolve = resolve;
    this.reject = reject;
  });
}

})();
