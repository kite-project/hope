(function() {

var list = document.querySelector('hope-tab-list');

// gaia branch
addEventListener('home-button-press', () => list.showCurrent());

// b2gdroid
addEventListener('keyup', e => {
  if (e.key && ~e.key.toLowerCase().indexOf('home')) list.showCurrent();
});

// addon
addEventListener('message', e => {
  if (e.data && ~e.data.indexOf('home')) list.showCurrent();
});

})();
