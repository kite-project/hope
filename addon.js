(function() {
  // CSS Override
  var sheet = document.createElement('style');
  sheet.setAttribute('type', 'text/css');

  var styleText = document.createTextNode([
    '#statusbar { background: #333333 !important; }',
    '#statusbar.light { filter:none !important; }',
    '#windows .appWindow .titlebar { background: #333333 !important }',
    '#windows .appWindow.homescreen { display:none !important; animation: none !important }',
    '#software-home-ring { outline: none; background: no-repeat center/70% url(' + browser.extension.getURL('assets/Home.png') + '); }',
    '#hope-back {',
    'position: absolute;',
    'top: 0;',
    'left: 1rem;',
    'height: 5rem;',
    'width: 7rem;',
    'padding: 0;',
    'pointer-events: all;',
    'background: transparent;',
    'background-image: url(' + browser.extension.getURL('assets/Back.png') + ');',
    'background-repeat: no-repeat;',
    'background-size: 23px 27px;',
    'background-position: center center;',
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

  var base = new URL(browser.extension.getURL('index.html')).origin;

  var req = new XMLHttpRequest();
  req.open('GET', browser.extension.getURL('index.html'));
  req.send();
  req.onload = function() {
    var content = `<base href="${base}/index.html">` + req.responseText;
    hopeFrame.src = 'data:text/html;charset=utf-8,' + encodeURI(content);
    document.body.appendChild(hopeFrame);
  };

  // Home button support
  window.addEventListener('home', function() {
    hopeFrame.contentWindow.postMessage('home-button-press', '*');
  });

  // Back button support
  var buttons = document.getElementById('software-buttons');
  var back = document.createElement('button');
  back.id = 'hope-back';
  buttons.insertBefore(back, buttons.firstElementChild);

  back.addEventListener('click', function() {
    hopeFrame.contentWindow.postMessage('back-button-press', '*');
  });
})();
