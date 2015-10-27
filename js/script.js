window.addEventListener('load', function() {

  // Geometry
  var height = window.innerHeight;

  var bodyStyles = window.getComputedStyle(document.body);
  var sbHeight = parseInt(bodyStyles.getPropertyValue('--statusbar-height'));
  var acHeight = parseInt(bodyStyles.getPropertyValue('--actionbar-height'));

  // Setting up the tabs
  var container = document.getElementById('tabs-scrollable');
  var grippy = container.querySelector('.grippy');
  grippy.style.top = height - acHeight + 'px';

  var background = document.getElementById('tabs-background');
  background.style.top = height + sbHeight + 'px';

  window.placeTabs = function() {
    var current = container.querySelector('.tab');
    current.classList.add('current');
    if (window.inTabsView) {
      current.classList.add('in-tabs-view');
    }
    current.classList.remove('move-up');
    current.classList.remove('move-down');
    current.classList.remove('will-open');
    current.style.top = 0;
    current.style.height = height * 2 + 'px';
    current.querySelector('.frame').style.height = height - sbHeight + 'px';

    var tabs = container.querySelectorAll('.tab:not(.current)');
    container.style.height = Math.max(height * 2,
                                      height + sbHeight +
                                        (tabs.length + 2) * acHeight) + 'px';
    background.style.height = parseInt(container.style.height) -
                              height - sbHeight + 'px';

    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      var shift = (i + 1) * acHeight + sbHeight;
      tab.style.top = height + shift + 'px';
      tab.style.height = Math.max(acHeight, height - shift) + 'px';

      tab.classList.remove('current');
      tab.classList.remove('move-up');
      tab.classList.remove('move-down');
      tab.classList.remove('will-open');
      tab.classList.remove('in-tabs-view');
    }
  };

  window.placeTabs();

  // Displaying the current tab
  var current = container.querySelector('.tab.current');
  current.scrollIntoView(true);
});

window.addEventListener('DOMContentLoaded', function() {
  var tabs = document.getElementById('tabs');

  var lastScrollTop;
  scheduler.attachDirect(tabs, 'scroll', function() {
    var newScrollTop = tabs.scrollTop;
    var height = window.innerHeight;

    if ((newScrollTop > lastScrollTop) &&
        (newScrollTop >= height / 2)) {
      enterTabs();
    }

    if ((newScrollTop < lastScrollTop) &&
        (newScrollTop <= height / 4)) {
      leaveTabs();
    }

    lastScrollTop = newScrollTop;
  });

  window.inTabsView = false;

  function enterTabs() {
    if (window.inTabsView) return;
    window.inTabsView = true;

    window.dispatchEvent(new CustomEvent('entering-tabs-view'));
  }

  function leaveTabs() {
    if (!window.inTabsView) return;
    window.inTabsView = false;

    window.dispatchEvent(new CustomEvent('leaving-tabs-view'));
  }
});
