window.addEventListener('DOMContentLoaded', function() {
  var bodyStyles = window.getComputedStyle(document.body);
  var acHeight = parseInt(bodyStyles.getPropertyValue('--actionbar-height'));
  var previewHeight = parseInt(bodyStyles.getPropertyValue('--preview-height'));
  var expandedHeight = parseInt(bodyStyles.getPropertyValue('--expanded-url-height'));
  var gutterHeight = parseInt(bodyStyles.getPropertyValue('--tab-gutter-height'));
  var snapHeight = window.innerHeight - expandedHeight;

  var current = null;
  var currentHome = null;
  var currentHistoryPosition = null;
  window.addEventListener('selected-tab', function(evt) {
    if (current) {
      scheduler.detachDirect(current, 'scroll', currentScroll);
      current = null;
    }

    if (currentHome) {
      currentHome.removeEventListener('click', fakeHomescreenHandler);
      currentHome = null;
    }

    current = window.domTabs[0].querySelector('.history');
    scheduler.attachDirect(current, 'scroll', currentScroll);
    currentScroll();

    currentHome = window.domTabs[0].querySelector('.iframe img');
    currentHome.addEventListener('click', fakeHomescreenHandler);
  });

  var fakeHomeScreenData = [
    [{
       title: 'Contacts',
       url: 'contacts.gaiamobile.org',
       themeColor: '#00AF84'
     }, {
       title: 'The Verge',
       url: 'theverge.com',
       themeColor: '#E14164'
     }, {
       title: 'Team Liquid',
       url: 'teamliquid.com',
       themeColor: '#3F5B94'
     }
    ],
    [{
       title: 'Vine',
       url: 'vine.com',
       themeColor: '#00AF84'
     }, {
       title: 'Camera',
       url: 'camera.gaiamobile.org',
       themeColor: '#56565A'
     }, {
       title: 'New York Times',
       url: 'nytimes.com',
       themeColor: '#56565A'
     }
    ],
    [{
       title: 'Wired',
       url: 'wired.com',
       themeColor: '#56565A'
     }, {
       title: 'BBC News',
       url: 'bbc.com',
       themeColor: '#BB1919'
     }, {
       title: 'Huffington Post',
       url: 'huffingtonpost.com',
       themeColor: '#2E7061'
     }
    ]
  ];

  function fakeHomescreenHandler(evt) {
    var x = evt.layerX;
    var y = evt.layerY;

    var col =  Math.floor((x * 3) / window.innerWidth);
    var row =  Math.floor((y * 3) / snapHeight);

    var fakeRow = fakeHomeScreenData[row];
    var fakeData = fakeRow && fakeRow[col];
    if (!fakeData) return;

    fakeLoad(fakeData);
  }

  var loading = false;
  function fakeLoad(data) {
    if (!current) return;

    if (loading) return;
    loading = true;

    current.dataset.title = data.title;
    current.dataset.url = data.url;
    current.dataset.color = data.themeColor;

    var img = current.querySelector('img')
    img.src = `assets/${data.url}.png`;
    img.onload = function() {
      window.goForward();
      setTimeout(function() {
        loading = false;
      }, 300);
    };
  }

  var leftPos;
  function currentScroll() {
    var tab = current.closest('.tab');
    leftPos = current.scrollLeft;
    if (leftPos < 50 && (currentHistoryPosition === null || currentHistoryPosition > 0)) {
      currentHistoryPosition = 0;
      tab.dataset.onHome = true;
      changeURL(tab)
      return;
    }

    if (leftPos > window.innerWidth - 50 && (currentHistoryPosition === null || currentHistoryPosition < 1)) {
      currentHistoryPosition = 1;
      tab.dataset.onHome = false;
      changeURL(tab)
      return;
    }
  }

  var changing = false;
  window.changeURL = function(tab, instant) {
    var history = tab.querySelector('.history');
    var onHome = tab.dataset.onHome == 'true';
    var url = tab.querySelector('.url');
    var urlText = url.querySelector('span');

    var text = onHome ? 'Search the web' : history.dataset.url;

    if (urlText.textContent == text &&
        url.classList.contains('is-home') == onHome && !changing) {
      return Promise.resolve();
    }

    changing = true;

    var mutate = function() {
      urlText.textContent = text;
      if (onHome) {
        url.classList.add('is-home');
        var color = '#56565A';
        window.setTabHeader(tab, 'Home', color);
      } else {
        url.classList.remove('is-home');
        window.setTabHeader(tab, history.dataset.title, history.dataset.color);
      }

      changing = false;
    };

    if (instant) {
      return scheduler.mutation(mutate);
    }

    return scheduler.feedback(function() {
      url.classList.add('change');
    }, url, 'transitionend').then(function() {
      return scheduler.mutation(mutate);
    }).then(function() {
      return scheduler.transition(function() {
        url.classList.remove('change');
      }, url, 'transitionend');
    });
  }

  window.goBack = function(instant) {
    if (loading) return;
    if (!current) return;
    if (currentHistoryPosition < 1) return;

    current.scrollTo({
      left: 0,
      behavior: instant ? 'auto' : 'smooth'
    });
  };

  window.goForward = function(instant) {
    if (!current) return;
    if (currentHistoryPosition > 0) return;

    current.scrollTo({
      left: window.innerWidth,
      behavior: instant ? 'auto' : 'smooth'
    });
  };

  window.addEventListener('back', function() {
    if (window.inTabsView) {
      return;
    }
    window.goBack();
  });
});
