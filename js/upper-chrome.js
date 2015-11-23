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
  window.addEventListener('selected-tab', function(evt) {
    selecting = true;
    return scheduler.transition(function() {
      url.classList.add('expand');
    }, url, 'transitionend').then(function() {
      selecting = false;
    });
  });
});
