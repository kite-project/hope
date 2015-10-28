window.addEventListener('DOMContentLoaded', function() {
  var content = [
    {
      url: 'about:home'
    },
    {
      url: 'twitter.com'
    },
    {
      url: 'mozilla.org'
    },
    {
      url: 'sgz.fr'
    },
    {
      url: 'theverge.com'
    },
    {
      url: 'new.ycombinator.com'
    },
    {
      url: 'google.com'
    }
  ];

  // Making the tab list overflow
  //content = content.concat(content);
  //content = content.concat(content);

  var container = document.querySelector('#tabs-scrollable');
  content.forEach(function(c, i) {
    var tab = makeTab(c.url);
    container.appendChild(tab);
  });

  function makeTab(url) {
    var tab = document.createElement('div');

    tab.classList.add('container');
    tab.classList.add('tab');

    tab.innerHTML = `
      <div class="frame">
        <div class="url">
          <a class="close">×</a>
          ${url}
        </div>
        <div class="iframe"></div>
        <div class="home-filler"></div>
      </div>
    `;

    return tab;
  }

  container.addEventListener('click', function(evt) {
    if (evt.target.classList.contains('close')) {
      close(evt);
      return;
    }
  });

  window.addEventListener('open-new-tab', function() {
    open();
  });

  var closing = false
  function close(evt) {
    if (closing) {
      return;
    }
    closing = true;

    var tab = evt.target.closest('.tab');
    var motions = [];

    motions.push(scheduler.transition(function() {
      tab.classList.add('will-close');
    }, tab, 'animationend'));

    var next = tab.nextSibling;
    while (next && next.classList.contains('tab')) {

      motions.push(scheduler.transition(function(next) {
        next.classList.add('move-up')
      }.bind(null, next), next, 'animationend'));

      next = next.nextSibling;
    }


    Promise.all(motions).then(function() {
      return scheduler.mutation(function() {
        tab.remove();
        window.placeTabs();
      });
    }).then(function() {
      closing = false;
    });
  }

  var opening = false
  function open() {
    if (opening) {
      return;
    }
    opening = true;


    var tab = makeTab('about:home');
    tab.style.top = window.innerHeight + 30 + 'px';
    tab.style.height = window.innerHeight + 'px';

    var previous = container.querySelector('.current')

    scheduler.mutation(function() {
      container.insertBefore(tab, previous);

      previous.classList.remove('current');
      previous.style.top = window.innerHeight + 30 + 'px';
      previous.style.height = window.innerHeight - 50 + 'px';
    }).then(function() {
      var motions = [];

      motions.push(scheduler.transition(function() {
        tab.classList.add('will-open');
      }, tab, 'animationend'));

      var next = tab.nextSibling;
      while (next && next.classList.contains('tab')) {

        motions.push(scheduler.transition(function() {
          next.classList.add('move-down')
        }, next, 'animationend'));

        next = next.nextSibling;
      }


      Promise.all(motions).then(function() {
        return scheduler.mutation(function() {
          window.placeTabs();
        });
      }).then(function() {
        opening = false;
      });
    });
  }
});

window.addEventListener('entering-tabs-view', function() {
  var current = document.querySelector('.tab.current');
  if (!current) return;

  scheduler.feedback(function() {
    current.classList.add('in-tabs-view');
  }, current, 'transitionend');
});

window.addEventListener('leaving-tabs-view', function() {
  var current = document.querySelector('.tab.current');
  if (!current) return;

  scheduler.feedback(function() {
    current.classList.remove('in-tabs-view');
  }, current, 'transitionend');
});
