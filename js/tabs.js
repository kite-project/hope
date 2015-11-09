window.addEventListener('DOMContentLoaded', function() {
  var content = [
    {
      title: 'Home',
      url: 'homescreen.gaiamobile.org'
    },
    {
      title: 'Square Space',
      url: 'squarespace.com'
    },
    {
      title: 'Mash Creative',
      url: 'mashcreative.com'
    },
    {
      title: 'Vine',
      url: 'vine.com'
    },
    {
      title: 'The Verge',
      url: 'theverge.com'
    }
  ];

  window.domTabs = [];

  var bodyStyles = window.getComputedStyle(document.body);
  var sbHeight = parseInt(bodyStyles.getPropertyValue('--statusbar-height'));
  var acHeight = parseInt(bodyStyles.getPropertyValue('--actionbar-height'));
  var previewHeight = parseInt(bodyStyles.getPropertyValue('--preview-height'));
  var hbHeight = parseInt(bodyStyles.getPropertyValue('--homebar-height'));
  var gutterHeight = parseInt(bodyStyles.getPropertyValue('--tab-gutter-height'));
  var snapHeight = window.innerHeight - previewHeight - acHeight - hbHeight;

  var tabs = document.getElementById('tabs');
  var container = document.querySelector('#tabs-scrollable');
  content.forEach(function(c, i) {
    var tab = makeTab(c);
    container.appendChild(tab);
    window.domTabs.push(tab);
  });

  function makeTab(data) {
    var tab = document.createElement('div');

    tab.classList.add('container');
    tab.classList.add('tab');

    tab.innerHTML = `
      <div class="frame">
        <div class="url">
          <a class="close"><img src="assets/Close_tab.png" /></a>
          <span class="title">
            ${data.title}
          </span>
          <span class="urlfield">
            ${data.url}
          </span>
        </div>
          <div class="iframe">
            <img src="assets/${data.url}.png" />
          </div>
        <div class="home-filler"></div>
      </div>
    `;

    return tab;
  }

  function publishTabSelected(tab) {
    window.dispatchEvent(new CustomEvent('selected-tab', {
      detail: {
        title: tab.querySelector('.title').textContent
      }
    }));
  }

  container.addEventListener('click', function(evt) {
    if (!window.inTabsView) {
      return;
    }

    if (evt.target.classList.contains('close')) {
      close(evt);
      return;
    }

    if (evt.target.classList.contains('url')) {
      select(evt);
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
    var tabIndex = window.domTabs.indexOf(tab);
    var motions = [];

    motions.push(scheduler.transition(function() {
      tab.classList.add('will-close');
    }, tab, 'animationend'));

    var nexts = window.domTabs.slice(tabIndex + 1);
    nexts.forEach(function(next) {
      motions.push(scheduler.transition(function(next) {
        next.classList.add('move-up')
      }.bind(null, next), next, 'animationend'));
    });

    Promise.all(motions).then(function() {
      return scheduler.mutation(function() {
        tab.remove();
        window.domTabs.splice(tabIndex, 1);
        return window.placeTabs();
      });
    }).then(function() {
      closing = false;
    });
  }

  function showFirstTab() {
    return new Promise(function(resolve) {
      if (tabs.scrollTop > snapHeight) {
        tabs.scrollTo({
          top: snapHeight,
          behavior: 'smooth'
        });
        setTimeout(resolve, 200);
      } else {
        resolve();
      }
    });
  }

  var opening = false
  function open() {
    if (opening) {
      return;
    }
    opening = true;


    var tab = makeTab({
      title: 'Home',
      url: 'homescreen.gaiamobile.org'
    });
    tab.style.zIndex = 0;
    tab.style.top = snapHeight + sbHeight - gutterHeight + 'px';
    tab.style.height = window.innerHeight + 'px';

    var previous = window.domTabs[0];

    showFirstTab().then(function() {
      scheduler.mutation(function() {
        container.insertBefore(tab, previous);
        window.domTabs.unshift(tab);

        previous.classList.remove('current');
        previous.style.top = snapHeight + sbHeight - gutterHeight + 'px';
        previous.style.height = snapHeight + 'px';
      }).then(function() {
        var motions = [];

        motions.push(scheduler.transition(function() {
          tab.classList.add('will-open');
        }, tab, 'animationend'));

        var nexts = window.domTabs.slice(1);
        nexts.forEach(function(next) {
          motions.push(scheduler.transition(function() {
            next.classList.add('move-down')
          }, next, 'animationend'));
        });

        Promise.all(motions).then(function() {
          return scheduler.mutation(function() {
            return window.placeTabs();
          });
        }).then(function() {
          window.goHome();
          return new Promise(function(resolve) {
            setTimeout(resolve, 250);
          });
        }).then(function() {
          publishTabSelected(tab);
          opening = false;
        });
      });
    });
  }

  var selecting = false
  function select(evt) {
    if (selecting) {
      return;
    }
    selecting = true;

    var tab = evt.target.closest('.tab');
    var tabIndex = window.domTabs.indexOf(tab);
    var previousCurrent = window.domTabs[0];

    var toMoveUp = window.domTabs.slice(0, tabIndex);

    scheduler.mutation(function() {
      previousCurrent.classList.remove('current');
      previousCurrent.style.top = window.innerHeight + 30 + 'px';
      previousCurrent.style.height = window.innerHeight - 50 + 'px';

      tab.style.height = tab.querySelector('.frame').style.height = window.innerHeight - sbHeight + 'px';

      tab.style.transition = 'transform 0.2s ease-in';
      toMoveUp.forEach(function(tab) {
        tab.style.height = acHeight + previewHeight + 'px';
        tab.style.transition = 'transform 0.2s ease-in';
      });
    }).then(function() {
      var motions = [];
      var translate = -1 * (parseInt(tab.style.top) - tabs.scrollTop - (sbHeight - gutterHeight));

      motions.push(scheduler.transition(function() {
        tab.style.transform = 'translateY(' + translate + 'px)';
      }, tab, 'transitionend'));

      toMoveUp.forEach(function(prev) {
        motions.push(scheduler.transition(function() {
          prev.style.transform = 'translateY(' + translate + 'px)';
        }, prev, 'transitionend'));
      });

      var nexts = window.domTabs.slice(tabIndex + 1);
      nexts.forEach(function(next) {
        motions.push(scheduler.transition(function() {
          next.classList.add('hide-down')
        }, next, 'animationend'));
      });

      return Promise.all(motions).then(function() {
        return scheduler.mutation(function() {
          // TODO: move
          tab.style.removeProperty('transition');
          tab.style.removeProperty('transform');
          toMoveUp.forEach(function(tab) {
          tab.style.removeProperty('transition');
            tab.style.removeProperty('transform');
          });
          window.domTabs.splice(tabIndex, 1);
          window.domTabs.unshift(tab);
          window.goHome(true);
          return window.placeTabs();
        });
      }).then(function() {
        publishTabSelected(tab);
        selecting = false;
      });
    });
  }
});

window.addEventListener('entering-tabs-view', function() {
  var current = window.domTabs[0];
  if (!current) return;

  scheduler.feedback(function() {
    current.classList.add('in-tabs-view');
  }, current, 'transitionend');
});

window.addEventListener('leaving-tabs-view', function() {
  var current = window.domTabs[0];
  if (!current) return;

  scheduler.feedback(function() {
    current.classList.remove('in-tabs-view');
  }, current, 'transitionend');
});
