window.addEventListener('load', function() {

  // Geometry
  var height = window.innerHeight;

  var bodyStyles = window.getComputedStyle(document.body);
  var sbHeight = parseInt(bodyStyles.getPropertyValue('--statusbar-height'));
  var acHeight = parseInt(bodyStyles.getPropertyValue('--actionbar-height'));

  // Setting up snapping
  var container = document.getElementById('tabs');
  container.style.height = height * 3 + 'px';

  var scrollable = document.getElementById('tabs-layer');
  scrollable.style.scrollSnapPointsY = 'repeat(' + height + 'px)';

  // Setting up the notification reveal
  var grippy = container.querySelector('.grippy');
  grippy.style.top = height - acHeight + 'px';

  var reveal = document.getElementById('notifications-reveal');
  reveal.style.height = height + 'px';

  // Setting up the tabs
  var tabs = container.querySelectorAll('.tab:not(.current)');
  var current = container.querySelector('.tab.current');
  current.style.height = height - sbHeight + 'px';

  for (var i = 0; i < tabs.length; i++) {
    var tab = tabs[i];
    var shift = (i + 1) * acHeight + sbHeight;
    tab.style.top = 2 * height  + shift + 'px';
    tab.style.height = height - shift + 'px';
  }

  // Displaying the current tab
  current.scrollIntoView(false);

});
