(function() {
  /*global browser*/

  // cleanup any previus kite addon assets
  Array.from(document.querySelectorAll('.kite-addon'))
    .forEach(el => el.remove());

  // CSS Override
  var sheet = document.createElement('style');
  sheet.setAttribute('type', 'text/css');
  sheet.className = 'kite-addon';

  var styleText = document.createTextNode(
    /* jshint ignore:start*/
    `@font-face {
      font-family: kite-icons;
      src: url(${browser.extension.getURL('node_modules/kite-icons/kite-icons.ttf')}) format("truetype");
      font-weight: 500;
      font-style: normal;
    }

    #statusbar {
      background: #333333 !important;
    }

    #statusbar.light {
      filter:none !important;
    }

    #windows .appWindow .titlebar {
      background: #333333 !important
    }

    #windows .appWindow.homescreen {
      display:none !important;
      animation: none !important
    }

    #software-home-ring {
      width: 38px;
      height: 38px;
      outline: none;
      background: #a7a7a7;
      border-radius: 50%;
      opacity: 0.2;
    }

    #hope-back {
      position: absolute;
      top: 0;
      left: 1rem;
      height: 5rem;
      padding: 0;
      pointer-events: all;
      background: transparent;
      border: none;
    }

    #hope-back::before {
      font-family: kite-icons;
      content: attr(data-icon);
      display: inline-block;
      font-size: 30px;
      font-weight: 500;
      text-align: center;
      text-rendering: optimizeLegibility;
    }`
    /*jshint ignore:end*/
  );

  sheet.appendChild(styleText);
  document.head.appendChild(sheet);

  // Injecting the hope frame
  var hopeFrame = document.createElement('iframe');
  hopeFrame.className = 'kite-addon';
  hopeFrame.style.border = '0';
  hopeFrame.style.zIndex = '4'; // on top of the homescreen
  hopeFrame.style.position = 'absolute';
  hopeFrame.style.top = 'var(--statusbar-height)';
  hopeFrame.style.left = hopeFrame.style.right = hopeFrame.style.bottom = '0';
  hopeFrame.style.width = '100%';
  hopeFrame.style.height = 'calc(100% - var(--statusbar-height) - var(--software-home-button-height))'; /*jshint ignore:line*/

  var base = new URL(browser.extension.getURL('index.html')).origin;

  var req = new XMLHttpRequest();
  req.open('GET', browser.extension.getURL('index.html'));
  req.send();
  req.onload = function() {
    var content = `<base href="${base}/index.html">` + req.responseText;
    hopeFrame.src = 'data:text/html;charset=utf-8,' + encodeURI(content);
    document.body.appendChild(hopeFrame);
  };


  // The event storage is used to lookup past events and remove them
  // this is required as a developer may reinstall the addon several times
  window.kiteEventStore = window.kiteEventStore || new WeakMap();
  function addEvent(element, name, functionCall) {
    var currentStore = window.kiteEventStore.get(element) || {};
    if (name in currentStore) {
      element.removeEventListener(name, currentStore[name]);
    }
    currentStore[name] = functionCall;
    window.kiteEventStore.set(element, currentStore);
    element.addEventListener(name, functionCall);
  }

  // Home button support
  addEvent(window, 'home', function() {
    hopeFrame.contentWindow.postMessage('home-button-press', '*');
  });

  // Back button support
  var buttons = document.getElementById('software-buttons');
  var back = document.createElement('button');
  back.id = 'hope-back';
  back.className = 'kite-addon';
  back.dataset.icon = 'back';
  back.setAttribute('aria-label', 'Back');
  buttons.insertBefore(back, buttons.firstElementChild);

  back.addEventListener('click', function() {
    hopeFrame.contentWindow.postMessage('back-button-press', '*');
  });
})();
