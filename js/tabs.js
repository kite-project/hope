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
    var tab = document.createElement('div');

    tab.classList.add('container');
    tab.classList.add('tab');

    tab.innerHTML = `
      <div class="frame">
        <div class="url">
          <a class="close">×</a>
          ${c.url}
        </div>
        <div class="iframe"></div>
        <div class="home-filler"></div>
      </div>
    `;

    container.appendChild(tab);
  });


  var closing = false
  container.addEventListener('click', function(evt) {
    if (!evt.target.classList.contains('close')) {
      return;
    }

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

      motions.push(scheduler.transition(function() {
        next.classList.add('move-up')
      }, next, 'animationend'));

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
  });
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
