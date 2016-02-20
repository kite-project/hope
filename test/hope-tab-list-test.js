/*global sinon, suite, setup, teardown, test, DomScheduler, assert */

suite('hope-tab-list >>', function() {
  'use strict';
  var dom, el;
  var initialNumberOfTabs = 7;

  suiteSetup(function() {
    HTMLIFrameElement.prototype.setVisible = function() {};
  });

  setup(function() {
    this.sinon = sinon.sandbox.create();

    dom = document.createElement('div');
    document.body.appendChild(dom);

    overrideProperty(window, 'innerWidth', { value: 640 });
    overrideProperty(window, 'innerHeight', { value: 960 });

    el = createTabList();
  });

  teardown(function() {
    dom.remove();
    this.sinon.restore();
  });

  suite('initial layout >', function() {
    test('it sets up snapping', function() {
      var inner = el.shadowRoot.querySelector('.inner');
      assert.equal(inner.style.scrollSnapPointsY, 'repeat(800px)');
    });

    test('it lays out the current tab properly', function() {
      return el.rendered.promise.then(() => {
        var current = el.querySelector('.current');
        assert.equal(current.style.height, 'calc(100vh + 800px)')
        assert.equal(current.style.zIndex, 1);
        assert.equal(current.style.top, '0px');
      });
    });

    test('it lays out the tabs view', function() {
      return el.rendered.promise.then(() => {
        var tabs = el.querySelectorAll('li:not(.current)');
        for (var i = 0; i < tabs.length; i++) {
          var tab = tabs[i];
          assert.equal(tab.style.height, '160px')
          assert.equal(tab.style.zIndex, i + 2);
          assert.equal(tab.style.top, window.innerHeight - 8  + i * 160 + 'px');
        }
      });
    });

    test('it sets a minimum size for the container', function() {
      return el.rendered.promise.then(() => {
        var container = el.shadowRoot.querySelector('.container');
        var size = window.innerHeight - 8 + (initialNumberOfTabs - 1) * 160;
        assert.equal(container.style.height, size + 'px');
      });
    });
  });

  suite('entering the tabs view by scrolling >', function() {
    setup(function() {
      var inner = el.shadowRoot.querySelector('.inner');
      return el.rendered.promise.then(() => {
        inner.scrollTop = 800;

        return new Promise((resolve) => {
          // Waiting for the scroll to be handled
          requestAnimationFrame(() => {
            // Waiting for the feedback to be executed
            scheduler.feedback(resolve);
          });
        });
      });
    });

    test('it reflects it in the state', function() {
      assert.isTrue(el.inTabsView);
    });

    test('it switches the current tab off', function() {
      var current = el.querySelector('.current');
      assert.isFalse(current.firstElementChild.active);
    });

    test('it shows the add button', function() {
      var add = el.shadowRoot.querySelector('.add');
      assert.isTrue(add.classList.contains('show'));
    });

    test('it hides the grippy', function() {
      var grippy = el.shadowRoot.querySelector('.add');
      assert.equal(grippy.style.opacity, 0);
    });

    suite('then leaving the tabs view by scrolling >', function() {
      setup(function() {
        var inner = el.shadowRoot.querySelector('.inner');
        inner.scrollTop = 0;

        return new Promise((resolve) => {
          // Waiting for the scroll to be handled
          requestAnimationFrame(() => {
            // Waiting for the feedback to be executed
            scheduler.feedback(resolve);
          });
        });
      });

      test('it reflects it in the state', function() {
        assert.isFalse(el.inTabsView);
      });

      test('it switches the current tab on', function() {
        var current = el.querySelector('.current');
        assert.isTrue(current.firstElementChild.active);
      });

      test('it hides the add button', function() {
        var add = el.shadowRoot.querySelector('.add');
        assert.isFalse(add.classList.contains('show'));
      });

      test('it shows the grippy', function() {
        var grippy = el.shadowRoot.querySelector('.add');
        assert.equal(grippy.style.opacity, '');
      });
    });

    suite('then adding a new tab >', function() {
      setup(function() {
        var add = el.shadowRoot.querySelector('.add');
        var inner = el.shadowRoot.querySelector('.inner');
        this.timeout(5000); // travis

        return new Promise((resolve) => {
          inner.addEventListener('scroll', function onScroll() {
            if (inner.scrollTop == 0) {
              inner.removeEventListener('scroll', onScroll);
              resolve();
            }
          });
          add.dispatchEvent(new CustomEvent('click'));
        });
      });

      test('it leaves the tabs view', function() {
        assert.isFalse(el.inTabsView);
      });

      test('it adds a new tab', function() {
        var tabs = el.querySelectorAll('hope-tab');
        assert.equal(tabs.length, initialNumberOfTabs + 1);

        var current = el.querySelector('.current').firstElementChild;
        assert.equal(current.url, 'https://rawgit.com/kite-project/hope-home/gh-pages/index.html');
      });
    });

    suite('then closing a tab >', function() {
      setup(function() {
        var toClose = el.querySelector('li');

        return new Promise((resolve) => {
          toClose.addEventListener('animationend', function animWait() {
            toClose.removeEventListener('animationend', animWait);
            scheduler.mutation(resolve);
          });

          var tab = toClose.querySelector('hope-tab');
          tab.dispatchEvent(new CustomEvent('closeclicked', { bubbles: true }));
        });
      });

      test('it stays the tabs view', function() {
        assert.isTrue(el.inTabsView);
      });

      test('it removes the tab', function() {
        var tabs = el.querySelectorAll('hope-tab');
        assert.equal(tabs.length, initialNumberOfTabs - 1);
      });
    });

    suite('then selecting a different tab >', function() {
      var toSelect;

      setup(function() {
        var tabs = el.querySelectorAll('hope-tab');
        toSelect = tabs[2];
        var inner = el.shadowRoot.querySelector('.inner');

        return new Promise((resolve) => {
          inner.addEventListener('scroll', function onScroll() {
            if (inner.scrollTop == 0) {
              inner.removeEventListener('scroll', onScroll);
              resolve();
            }
          });
          toSelect.dispatchEvent(new CustomEvent('click', { bubbles: true }));
        });
      });

      test('it leaves the tabs view', function() {
        assert.isFalse(el.inTabsView);
      });

      test('the selected tab is active', function() {
        assert.isTrue(toSelect.active);
      });

      test('the new tab is the current tab', function() {
        var current = el.querySelector('.current');
        assert.equal(current.firstElementChild, toSelect);
      });
    });

    suite('race prevention while selecting >', function() {
      var toSelect;
      var tabs;

      setup(function() {
        var toClose = el.querySelector('li');
        var add = el.shadowRoot.querySelector('.add');

        tabs = el.querySelectorAll('hope-tab');
        toSelect = tabs[2];
        var inner = el.shadowRoot.querySelector('.inner');

        return new Promise((resolve) => {
          inner.addEventListener('scroll', function onScroll() {
            if (inner.scrollTop == 0) {
              inner.removeEventListener('scroll', onScroll);
              resolve();
            }
          });
          toSelect.dispatchEvent(new CustomEvent('click', { bubbles: true }));

          setTimeout(() => {
            // closing at the same time
            var tab = toClose.querySelector('hope-tab');
            tab.dispatchEvent(new CustomEvent('closeclicked', { bubbles: true }));
            // opening at the same time
            add.dispatchEvent(new CustomEvent('click'));
          });
        });
      });

      test('no tab was added or removed', function() {
        var newTabs = el.querySelectorAll('hope-tab');
        for (var i = 0; i < newTabs.length; i++) {
          assert.equal(tabs[i], newTabs[i]);
        }
      });
    });

    suite('race prevention while opening >', function() {
      var tabs;
      var toSelect;

      setup(function() {
        var add = el.shadowRoot.querySelector('.add');
        var inner = el.shadowRoot.querySelector('.inner');

        tabs = el.querySelectorAll('hope-tab');
        toSelect = tabs[2];

        var toClose = el.querySelector('li');

        return new Promise((resolve) => {
          inner.addEventListener('scroll', function onScroll() {
            if (inner.scrollTop == 0) {
              inner.removeEventListener('scroll', onScroll);
              resolve();
            }
          });
          add.dispatchEvent(new CustomEvent('click'));

          setTimeout(() => {
            // closing at the same time
            var tab = toClose.querySelector('hope-tab');
            tab.dispatchEvent(new CustomEvent('closeclicked', { bubbles: true }));
            // selecting at the same time
            toSelect.dispatchEvent(new CustomEvent('click', { bubbles: true }));
          });
        });
      });

      test('the selected tab is not the racy one', function() {
        assert.notOk(toSelect.active);
      });

      test('no tab was removed', function() {
        var newTabs = el.querySelectorAll('li:not(.current) hope-tab');
        for (var i = 0; i < newTabs.length; i++) {
          assert.equal(tabs[i], newTabs[i]);
        }
      });

      test('a tab was added', function() {
        var tabs = el.querySelectorAll('hope-tab');
        assert.equal(tabs.length, initialNumberOfTabs + 1);

        var current = el.querySelector('.current').firstElementChild;
        assert.equal(current.url, 'https://rawgit.com/kite-project/hope-home/gh-pages/index.html');
      });
    });

    suite('race prevention while closing >', function() {
      setup(function() {
        var add = el.shadowRoot.querySelector('.add');
        var toClose = el.querySelector('li');
        var tabs = el.querySelectorAll('hope-tab');
        var toSelect = tabs[2];

        return new Promise((resolve) => {
          toClose.addEventListener('animationend', function animWait() {
            toClose.removeEventListener('animationend', animWait);
            // leaving time for things to go wrong :)
            setTimeout(resolve, 1000);
          });

          var tab = toClose.querySelector('hope-tab');
          tab.dispatchEvent(new CustomEvent('closeclicked', { bubbles: true }));

          setTimeout(() => {
            // selecting at the same time
            toSelect.dispatchEvent(new CustomEvent('click', { bubbles: true }));
            // opening at the same time
            add.dispatchEvent(new CustomEvent('click'));
          });
        });
      });

      test('it stays the tabs view and removes the tab', function() {
        assert.isTrue(el.inTabsView);

        var tabs = el.querySelectorAll('hope-tab');
        assert.equal(tabs.length, initialNumberOfTabs - 1);
      });
    });
  });


  function createTabList() {
    var html = '<hope-tab-list>'
    +   '<li>'
    +     '<hope-tab url="about:blank"></hope-tab>'
    +   '</li>'
    +   '<li>'
    +     '<hope-tab url="about:blank"></hope-tab>'
    +   '</li>'
    +   '<li>'
    +     '<hope-tab url="about:blank"></hope-tab>'
    +   '</li>'
    +   '<li>'
    +     '<hope-tab url="about:blank"></hope-tab>'
    +   '</li>'
    +   '<li>'
    +     '<hope-tab url="about:blank"></hope-tab>'
    +   '</li>'
    +   '<li>'
    +     '<hope-tab url="about:blank"></hope-tab>'
    +   '</li>'
    +   '<li>'
    +     '<hope-tab url="about:blank"></hope-tab>'
    +   '</li>'
    + '</hope-tab-list>';

    dom.innerHTML = html;
    return dom.firstElementChild;
  }

  function overrideProperty(obj, propName, newConfig) {
    var previousDescriptor = Object.getOwnPropertyDescriptor(obj, propName);
    if (previousDescriptor) {
      suiteTeardown(() => {
        Object.defineProperty(obj, propName, previousDescriptor);
      });
    }
    newConfig.configurable = true;
    Object.defineProperty(obj, propName, newConfig);
  }

});
