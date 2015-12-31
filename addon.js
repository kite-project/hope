(function() {
  // CSS Override
  var sheet = document.createElement('style');
  sheet.setAttribute('type', 'text/css');

  var styleText = document.createTextNode([
    '#statusbar { background: #333333 !important; }',
    '#statusbar.light { filter:none !important; }',
    '#windows .appWindow .titlebar { background: #333333 !important }',
    '#windows .appWindow.homescreen { display:none !important; animation: none !important }',
    '#software-home-ring {',
    'outline: none;',
    '--ring-height-width: inherit;',
    'width: 3rem;',
    'height: 3rem;',
    'position: relative;',
    'left: -3rem;',
    '}',
    '#hope-back {',
    'position: absolute;',
    'top: 0;',
    'left: 1rem;',
    'height: 5rem;',
    'width: 7rem;',
    'padding: 0;',
    'pointer-events: all;',
    'background: transparent;',
    'border: none;',
    '}',
  ].join('\n'));

  sheet.appendChild(styleText);
  document.head.appendChild(sheet);

  // Injecting the hope frame
  var hopeFrame = document.createElement('iframe');
  hopeFrame.style.border = '0';
  hopeFrame.style.zIndex = '4'; // on top of the homescreen
  hopeFrame.style.position = 'absolute';
  hopeFrame.style.top = 'var(--statusbar-height)';
  hopeFrame.style.left = hopeFrame.style.right = hopeFrame.style.bottom = '0';
  hopeFrame.style.width = '100%';
  hopeFrame.style.height = 'calc(100% - var(--statusbar-height) - var(--software-home-button-height))';
  hopeFrame.src = browser.extension.getURL('index.html');
  document.body.appendChild(hopeFrame);

  // Home button support
  window.addEventListener('home', function() {
    hopeFrame.contentWindow.postMessage('home-button-press', '*');
  });

  // Back button support
  var buttons = document.getElementById('software-buttons');
  var back = document.createElement('button');
  var home = document.getElementById('software-home-ring');
  back.id = 'hope-back';
  back.dataset.icon = 'left';
  back.setAttribute('aria-label', 'back');
  buttons.insertBefore(back, buttons.firstElementChild);
  home.setAttribute('aria-label', 'home');
  home.dataset.icon = 'home';

  back.addEventListener('click', function() {
    hopeFrame.contentWindow.postMessage('back-button-press', '*');
  });

})();
