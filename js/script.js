window.addEventListener('load', function() {

  // Geometry
  var height = window.innerHeight;
  document.body.style.setProperty('--height', height + 'px');

  var bodyStyles = window.getComputedStyle(document.body);
  var sbHeight = parseInt(bodyStyles.getPropertyValue('--statusbar-height'));
  var acHeight = parseInt(bodyStyles.getPropertyValue('--actionbar-height'));
  var hbHeight = parseInt(bodyStyles.getPropertyValue('--homebar-height'));
  var previewHeight = parseInt(bodyStyles.getPropertyValue('--preview-height'));
  var gutterHeight = parseInt(bodyStyles.getPropertyValue('--tab-gutter-height'));
  var snapHeight = height - hbHeight - acHeight - previewHeight - gutterHeight;
  var viewportHeight = height - sbHeight - hbHeight;

  // Setting up the tabs
  var container = document.getElementById('tabs-scrollable');
  var tabsContainer = document.getElementById('tabs');
  var grippy = container.querySelector('.grippy');
  grippy.style.top = height - acHeight + 'px';

  var background = document.getElementById('tabs-background');
  background.style.top = snapHeight + 'px';

  var cleanUp = function(tab) {
    tab.classList.remove('current');
    tab.classList.remove('move-up');
    tab.classList.remove('move-down');
    tab.classList.remove('hide-up');
    tab.classList.remove('hide-down');
    tab.classList.remove('will-open');
    tab.classList.remove('will-select');
    tab.classList.remove('in-tabs-view');
  }

  window.placeTabs = function() {
    return new Promise(function(resolve) {
      var current = window.domTabs[0];
      cleanUp(current);
      current.classList.add('current');
      if (window.inTabsView) {
        current.classList.add('in-tabs-view');
      }
      current.style.zIndex = 1;

      current.style.top = 0;
      current.querySelector('.frame').style.height = viewportHeight + 'px';
      current.style.height = viewportHeight + snapHeight + sbHeight + 'px';

      var tabs = window.domTabs.slice(1);
      var tabHeight = Math.max(gutterHeight + acHeight + previewHeight,
                               snapHeight / tabs.length);
      var top = viewportHeight + sbHeight + gutterHeight;

      for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        tab.style.zIndex = i + 2;

        tab.style.top = top + 'px';
        tab.querySelector('.frame').style.height = '';
        tab.style.height = tabHeight + 'px';

        top += tabHeight;

        cleanUp(tab);
      }

      var newHeight = Math.max(snapHeight * 2, top + hbHeight);

      var updateContainer = function() {
        container.style.height = newHeight + 'px';
        background.style.height = newHeight - snapHeight + 'px';
        resolve();
      };

      var scrollTop = tabsContainer.scrollTop;
      if ((scrollTop + height) > newHeight) {
        tabsContainer.scrollTo({
          top: scrollTop - (acHeight + previewHeight + gutterHeight),
          behavior: 'smooth'
        });
        setTimeout(updateContainer, 300);
      } else {
        updateContainer();
      }
    });
  };

  window.placeTabs();

  // Displaying the current tab
  var current = window.domTabs[0];
  current.scrollIntoView(true);



  var sbTitle = document.querySelector('#statusbar span')
  window.addEventListener('selected-tab', function(evt) {
    scheduler.mutation(function() {
      sbTitle.textContent = evt.detail.title;
    });
  });
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
