/* globals scheduler */

window.addEventListener('DOMContentLoaded', function() {
  var tabs = document.getElementById('tabs');
  var add = document.getElementById('add');

  window.addEventListener('entering-tabs-view', function() {
    scheduler.feedback(function() {
      add.classList.add('show');
    }, add, 'animationend');
  });

  window.addEventListener('leaving-tabs-view', function() {
    scheduler.feedback(function() {
      add.classList.remove('show');
    }, add, 'animationend');
  });

  window.addEventListener('home-button-press', function() {
    window.goHome();
  });

  window.addEventListener('keyup', function(evt) {
    if (evt.key && evt.key.toLowerCase().indexOf('home') !== -1) {
      window.goHome();
    }
  });

  add.addEventListener('click', function(evt) {
    if (!window.inTabsView) {
      return;
    }

    evt.target.classList.toggle('tap');
    window.dispatchEvent(new CustomEvent('open-new-tab'));
  });

  window.goHome = function(instant) {
    tabs.scrollTo({
      top: 0,
      behavior: instant ? 'auto' : 'smooth'
    });

    if (!window.inTabsView) {
      window.goBack();
    }
  };
});

