/* global dispatchEvent */
(function() {

var list = document.querySelector('hope-tab-list');

// gaia branch
addEventListener('home-button-press', () => list.showCurrent());

// b2gdroid
addEventListener('load', () => replyToChrome('system-message-listener-ready'));

addEventListener('keyup', e => {
  if (e.key && ~e.key.toLowerCase().indexOf('home')) list.showCurrent();
});

// addon
addEventListener('message', e => {
  if (e.data && ~e.data.indexOf('home')) list.showCurrent();
});

// Remote debugging on b2gdroid
// You'll a gecko with pref("devtools.debugger.forbid-certified-apps", false);

var remoteDebugging = false;
if (!remoteDebugging) return;

navigator.mozSettings.createLock().set({
  'devtools.debugger.remote-enabled': true
});
navigator.mozSettings.createLock().set({
  'debugger.remote-mode': 'adb-devtools'
});

addEventListener('mozChromeEvent', e => {
  if (e.detail.type !== 'remote-debugger-prompt') {
    return;
  }
  replyToChrome('remote-debugger-prompt', { authResult: 'ALLOW' });
});


function replyToChrome(type, detail) {
  var d = detail || {};
  d.type = type;

  var evt = new CustomEvent('mozContentEvent', {
    bubbles: true,
    detail: d
  });
  dispatchEvent(evt);
}


})();
