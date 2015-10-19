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

  var current = container.querySelector('.tab.current');
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
  }

  // Displaying the current tab
  current.scrollIntoView(true);
});
