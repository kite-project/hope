(function() {

var list = document.querySelector('hope-tab-list');

addEventListener('home-button-press', () => list.showCurrent());
addEventListener('keyup', e => {
  if (e.key && ~e.key.toLowerCase().indexOf('home')) list.showCurrent();
});

})();
