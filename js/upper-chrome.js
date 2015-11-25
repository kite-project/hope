window.addEventListener('DOMContentLoaded', function() {
  var url = document.getElementById('url');
  var urlText = url.querySelector('span');

  window.addEventListener('entering-tabs-view', function() {
    if (!url.classList.contains('expand')) {
      return;
    }

    scheduler.feedback(function() {
      url.classList.remove('expand');
    }, url, 'transitionend');
  });

  window.addEventListener('entering-utility-view', function() {
    if (!url.classList.contains('expand')) {
      return;
    }

    scheduler.feedback(function() {
      url.classList.remove('expand');
    }, url, 'transitionend');
  });

  window.addEventListener('leaving-tabs-view', function() {
    if (selecting || url.classList.contains('expand')) {
      return;
    }
    scheduler.feedback(function() {
      url.classList.add('expand');
    }, url, 'transitionend');
  });

  window.addEventListener('leaving-utility-view', function() {
    if (selecting || url.classList.contains('expand')) {
      return;
    }
    scheduler.feedback(function() {
      url.classList.add('expand');
    }, url, 'transitionend');
  });

  var selecting = false;
  var current = null;
  var currentHistoryPosition = null;
  window.addEventListener('selected-tab', function(evt) {
    selecting = true;
    if (current) {
      scheduler.detachDirect(current, 'scroll', currentScroll);
      current = null;
    }

    return scheduler.transition(function() {
      url.classList.add('expand');
    }, url, 'transitionend').then(function() {
      selecting = false;

      current = document.querySelector('.tab.current .history');
      scheduler.attachDirect(current, 'scroll', currentScroll);
      currentScroll();
    });
  });

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

  window.changeURL = function(tab, instant) {
    var history = tab.querySelector('.history');
    var onHome = tab.dataset.onHome == 'true';

    var text = onHome ? 'Search the web' : history.dataset.url;

    if (urlText.textContent == text &&
        url.classList.contains('is-home') == onHome) {
      return Promise.resolve();
    }

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
});
