/*global fxosComponent, HopeTab, scheduler */
(function() {

var debug = 1 ? (...args) => console.log('[hope-tab-list]', ...args) : () => {};

const BAR_HEIGHT = HopeTab.BAR_HEIGHT;
const PREVIEW_HEIGHT = 88;
const GUTTER_HEIGHT = 8;
const TAB_HEIGHT = BAR_HEIGHT + PREVIEW_HEIGHT + GUTTER_HEIGHT;

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

    // Events
    scheduler.attachDirect(this.els.inner, 'scroll', this.onScroll);
    on(this.els.container, 'close-clicked', e => this.onClose(e));
    on(this.els.container, 'click', e => this.onClick(e));
    on(this.els.add, 'click', e => this.onAddClick(e));

    this.setupSnapping();

    // Layout when decendants are ready
    setTimeout(() => this.layout());
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
    this.open({
      title: 'Home',
      url: 'homescreen.gaiamobile.org'
    });
  },

  getSnapHeight() {
    return window.innerHeight -
      PREVIEW_HEIGHT -
      GUTTER_HEIGHT -
      BAR_HEIGHT;
  },

  getTabHeight() {
    return Math.max(
      TAB_HEIGHT,
      this.getSnapHeight() / this.els.tabs.length
    );
  },

  getScrollTop() {
    return this.els.inner.scrollTop;
  },

  scrollTo(top, options={}) {
    return new Promise(resolve => {
      this.els.inner.scrollTo({
        top: top,
        behavior: options.instant ? 'auto' : 'smooth'
      });

      setTimeout(resolve, options.wait || 300);
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

        top += tabHeight - 4;
        this.cleanUp(tab);
      }

      var newHeight = Math.max(snapHeight * 2, top);
      var scrollTop = this.getScrollTop();

      if ((scrollTop + window.innerHeight) < newHeight) {
        updateContainer();
        return;
      }

      this.scrollTo(scrollTop - TAB_HEIGHT)
        .then(updateContainer);

      function updateContainer() {
        container.style.height = newHeight + 'px';
        resolve();
      }
    });
  },

  open(options) {
    if (this.opening) return;
    this.opening = true;
    debug('open');

    var snapHeight = this.getSnapHeight();
    var tab = this.create(options);
    var previous = this.els.tabs[0];
    var content = previous.firstElementChild;

    tab.style.top = snapHeight - GUTTER_HEIGHT + 'px';
    tab.style.height = window.innerHeight + 'px';
    tab.style.zIndex = 0;

    this.showFirstTab()
      .then(() => {
        return scheduler.mutation(() => {
          debug('attaching new tab');
          this.insertBefore(tab, previous);
          this.els.tabs.unshift(tab);

          content.active = false;
          previous.classList.remove('current');
          previous.style.top = snapHeight - GUTTER_HEIGHT + 'px';
          previous.style.height = snapHeight + 'px';
        });
      })

      // Don't show the tab until iframe has loaded
      .then(() => this.els.tabs.loaded)

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
      .then(() => this.scrollTo(0, { wait: 450 }))
      .then(() => this.opening = false);
  },

  close(tab) {
    if (this.closing || this.els.tabs.length == 1) return;

    debug('close', tab);
    this.closing = true;

    var tabIndex = this.els.tabs.indexOf(tab);
    var tabsAfter = this.els.tabs.slice(tabIndex + 1);
    var motions = [];

    motions.push(scheduler.transition(() => {
      tab.classList.add('will-close');
    }, tab, 'animationend'));

    tabsAfter.forEach(el => {
      motions.push(
        scheduler.transition(() => {
          el.classList.add('move-up');
        }, el, 'animationend', 1000)
      );
    });

    Promise.all(motions)
      .then(() => {
        return scheduler.mutation(() => {
          tab.remove();
          this.els.tabs.splice(tabIndex, 1);
          return this.layout();
        });
      })

      .then(() => {
        if (this.els.tabs.length === 1) this.select(this.els.tabs[0]);
        this. closing = false;
      });
  },

  select(tab) {
    if (this.selecting) return Promise.reject();
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
        el.style.height = TAB_HEIGHT + 'px';
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

  create(data) {
    debug('create', data);
    var li = document.createElement('li');
    var tab = document.createElement('hope-tab');

    tab.themeColor = data.themeColor;
    tab.title = data.title;
    tab.url = data.url;

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
    tab.classList.remove('move-up');
    tab.classList.remove('move-down');
    tab.classList.remove('hide-up');
    tab.classList.remove('hide-down');
    tab.classList.remove('will-open');
    tab.classList.remove('will-select');
    tab.classList.remove('in-tabs-view');
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

      ::content li.move-up {
        animation-delay: var(--motion-delay);
        animation-duration: var(--motion-delay);
        animation-name: move-up;
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

      ::content li.will-close > hope-tab {
        animation-name: will-close;
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
        content: 'add';
        font-family: fxos-icons;
        font-size: 50px;
        font-weight: 500;
        text-rendering: optimizeLegibility;
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

      @keyframes move-up {
        0% { transform: translateY(0) }
        100% {
          transform: translateY(calc((var(--actionbar-height) + var(--preview-height) + var(--tab-gutter-height) - 4px) * -1));
        }
      }

      @keyframes move-down {
        from { transform: translateY(0) }
        to {
          transform: translateY(calc(var(--actionbar-height) + var(--preview-height) + 4px));
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
function off(el, name, fn) { el.removeEventListener(name, fn); }

})();
