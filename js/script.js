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

  window.placeTabs = function() {
    var current = container.querySelector('.tab');
    current.classList.add('current');
    if (window.inTabsView) {
      current.classList.add('in-tabs-view');
    }
    current.classList.remove('move-up');
    current.style.top = 0;
    current.style.height = height * 2 + 'px';
    current.querySelector('.frame').style.height = height - sbHeight + 'px';

    var tabs = container.querySelectorAll('.tab:not(.current)');
    container.style.height = Math.max(height * 2,
                                      height + sbHeight +
                                        (tabs.length + 2) * acHeight) + 'px';

    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      var shift = (i + 1) * acHeight + sbHeight;
      tab.style.top = height + shift + 'px';
      tab.style.height = Math.max(50, height - shift) + 'px';

      tab.classList.remove('move-up');
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

    if ((newScrollTop > lastScrollTop) &&
        (newScrollTop >= (tabs.scrollTopMax - 250))) {
      enterTabs();
    }

    if ((newScrollTop < lastScrollTop) &&
        (newScrollTop <= (tabs.scrollTopMax - 200))) {
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
