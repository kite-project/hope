window.addEventListener('DOMContentLoaded', function() {
  var menu = document.querySelector('#home-zone .menu');

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
});

