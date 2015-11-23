window.addEventListener('DOMContentLoaded', function() {
  var content = [
    {
      title: 'Home',
      url: 'homescreen.gaiamobile.org',
      isHome: true
    },
    {
      title: 'Square Space',
      url: 'squarespace.com',
      themeColor: '#E55525'
    },
    {
      title: 'Mash Creative',
      url: 'mashcreative.com'
    },
    {
      title: 'Vine',
      url: 'vine.com',
      themeColor: '#00AF84'
    },
    {
      title: 'The Verge',
      url: 'theverge.com',
      themeColor: '#E14164'
    }
  ];

  window.domTabs = [];

  var bodyStyles = window.getComputedStyle(document.body);
  var sbHeight = parseInt(bodyStyles.getPropertyValue('--statusbar-height'));
  var acHeight = parseInt(bodyStyles.getPropertyValue('--actionbar-height'));
  var previewHeight = parseInt(bodyStyles.getPropertyValue('--preview-height'));
  var hbHeight = parseInt(bodyStyles.getPropertyValue('--homebar-height'));
  var gutterHeight = parseInt(bodyStyles.getPropertyValue('--tab-gutter-height'));
  var expandedHeight = parseInt(bodyStyles.getPropertyValue('--expanded-url-height'));
  var snapHeight = window.innerHeight - hbHeight - acHeight - previewHeight - gutterHeight;

  var url = document.getElementById('url');
  var urlText = url.querySelector('span');

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
        <div class="overlay"></div>
        <div class="bar">
          <a class="close"><img src="assets/Close_tab.png" /></a>
          <span class="title">
            ${data.title}
          </span>
        </div>
        <div class="iframe">
          <img src="assets/${data.url}.png" />
        </div>
      </div>
    `;

    if (data.themeColor) {
      tab.querySelector('.bar').style.backgroundColor = data.themeColor;
      tab.querySelector('.overlay').style.backgroundColor = data.themeColor;
    } else {
      tab.querySelector('.overlay').style.backgroundColor = '#56565A';
    }

    tab.dataset.url = data.url;
    tab.classList.toggle('is-home', !!data.isHome);

    return tab;
  }

  function publishTabSelected(tab) {
    window.dispatchEvent(new CustomEvent('selected-tab', {
      detail: {
        title: tab.querySelector('.title').textContent,
        url: tab.dataset.url,
        isHome: tab.classList.contains('is-home')
      }
    }));
  }

  container.addEventListener('click', function(evt) {
    if (!window.inTabsView) {
      return;
    }

    if (opening || closing || selecting) {
      return;
    }

    if (evt.target.classList.contains('close')) {
      close(evt);
      return;
    }

    if (evt.target.classList.contains('bar') ||
        evt.target.classList.contains('iframe')) {

      select(evt);
      return;
    }
  });

  window.addEventListener('open-new-tab', function() {
    open();
  });

  var closing = false
  function close(evt) {
    if (closing || window.domTabs.length == 1) {
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
      }.bind(null, next), next, 'animationend', 1000 /* got a delay */));
    });

    Promise.all(motions).then(function() {
      return scheduler.mutation(function() {
        tab.remove();
        window.domTabs.splice(tabIndex, 1);
        return window.placeTabs();
      });
    }).then(function() {
      if (window.domTabs.length === 1) {
        select({
          target: window.domTabs[0]
        });
      }
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
      url: 'homescreen.gaiamobile.org',
      isHome: true
    });
    tab.style.zIndex = 0;
    tab.style.top = snapHeight + sbHeight - gutterHeight + 'px';
    tab.style.height = window.innerHeight + 'px';
    tab.classList.add('new');

    var previous = window.domTabs[0];

    showFirstTab().then(function() {
      scheduler.mutation(function() {
        container.insertBefore(tab, previous);
        window.domTabs.unshift(tab);

        previous.classList.remove('current');
        previous.style.top = snapHeight + sbHeight - gutterHeight + 'px';
        previous.style.height = snapHeight + 'px';

        urlText.textContent = 'Search the web';
        url.classList.add('is-home');
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
          tab.classList.remove('new');
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
    var nexts = window.domTabs.slice(tabIndex + 1);

    scheduler.mutation(function() {
      previousCurrent.classList.remove('current');
      previousCurrent.querySelector('.frame').style.height = '';
      previousCurrent.style.top = snapHeight + sbHeight - gutterHeight + 'px';
      previousCurrent.style.height = snapHeight + 'px';

      tab.style.height = tab.querySelector('.frame').style.height = window.innerHeight - sbHeight - gutterHeight + 'px';

      tab.style.transition = 'transform 0.2s ease-in';
      toMoveUp.forEach(function(tab) {
        tab.style.height = acHeight + previewHeight + gutterHeight + 'px';
        tab.style.transition = 'transform 0.2s ease-in';
      });

      if (tab.classList.contains('is-home')) {
        urlText.textContent = 'Search the web';
        url.classList.add('is-home');
      } else {
        urlText.textContent = tab.dataset.url;
        url.classList.remove('is-home');
      }
    }).then(function() {
      var feedbacks = [];
      feedbacks.push(scheduler.transition(function() {
        tab.classList.add('shrink-middle')
      }, tab, 'animationend').then(function() {
        tab.classList.remove('shrink-middle');
      }));

      var top = toMoveUp.length && toMoveUp[toMoveUp.length - 1];
      if (top) {
        feedbacks.push(scheduler.transition(function() {
          top.classList.add('shrink-top')
        }, top, 'animationend').then(function() {
          top.classList.remove('shrink-top')
        }));
      }

      var bottom = nexts.length && nexts[0];
      if (bottom) {
        feedbacks.push(scheduler.transition(function() {
          bottom.classList.add('shrink-bottom')
        }, bottom, 'animationend').then(function() {
          bottom.classList.remove('shrink-bottom')
        }));
      }

      return Promise.all(feedbacks);
    }).then(function() {
      var motions = [];
      var translate = -1 * (parseInt(tab.style.top) - tabs.scrollTop - (expandedHeight - acHeight - gutterHeight));

      motions.push(scheduler.transition(function() {
        tab.style.transform = 'translateY(' + translate + 'px)';
      }, tab, 'transitionend'));

      toMoveUp.forEach(function(prev) {
        motions.push(scheduler.transition(function() {
          prev.style.transform = 'translateY(' + translate + 'px)';
        }, prev, 'transitionend'));
      });

      nexts.forEach(function(next) {
        motions.push(scheduler.transition(function() {
          next.classList.add('hide-down')
        }, next, 'animationend'));
      });

      return Promise.all(motions);
    }).then(function() {
      return scheduler.mutation(function() {
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
      selecting = false;
      publishTabSelected(tab);
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
