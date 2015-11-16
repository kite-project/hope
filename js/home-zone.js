window.addEventListener('DOMContentLoaded', function() {
  var homeZone = document.getElementById('home-zone');
  var menu = homeZone.querySelector('.menu');
  var tabsLayer = document.getElementById('tabs-layer');
  var tabs = document.getElementById('tabs');
  var height = window.innerHeight;

  window.addEventListener('entering-tabs-view', function() {
    scheduler.feedback(function() {
      menu.classList.add('show-add');
    }, menu, 'animationend');
  });

  window.addEventListener('leaving-tabs-view', function() {
    scheduler.feedback(function() {
      menu.classList.remove('show-add');
    }, menu, 'animationend');
  });

  homeZone.addEventListener('click', function(evt) {
    if (evt.target.classList.contains('add')) {
      if (window.inTabsView) {
        evt.target.classList.toggle('tap');
        window.dispatchEvent(new CustomEvent('open-new-tab'));
      }
      return;
    }

    if (evt.target.classList.contains('go-home')) {
      evt.target.classList.toggle('tap');
      window.goHome();
      return;
    }
  });

  window.goHome = function(instant) {
    tabsLayer.scrollTo({
      top: height,
      behavior: instant ? 'auto' : 'smooth'
    });
    tabs.scrollTo({
      top: 0,
      behavior: instant ? 'auto' : 'smooth'
    });
  };
});

