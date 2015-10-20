window.addEventListener('DOMContentLoaded', function() {
  var tabs = document.getElementById('tabs');

  var lastScrollTop;
  scheduler.attachDirect(tabs, 'scroll', function() {
    var newScrollTop = tabs.scrollTop;

    if ((newScrollTop > lastScrollTop) &&
        (newScrollTop >= (tabs.scrollTopMax - 250))) {
      showAdd();
    }

    if ((newScrollTop < lastScrollTop) &&
        (newScrollTop <= (tabs.scrollTopMax - 200))) {
      hideAdd();
    }

    lastScrollTop = newScrollTop;
  });

  var menu = document.querySelector('#home-zone .menu');
  var showing = false;

  function showAdd() {
    if (showing) return;
    showing = true;
    scheduler.feedback(function() {
      menu.classList.add('show-add');
    }, menu, 'animationend')
  }

  function hideAdd() {
    if (!showing) return;
    showing = false;
    scheduler.feedback(function() {
      menu.classList.remove('show-add');
    }, menu, 'animationend')
  }
});
