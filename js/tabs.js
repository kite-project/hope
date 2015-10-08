window.addEventListener('DOMContentLoaded', function() {
  var content = [
    {
      url: 'about:home'
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
      url: 'twitter.com'
    }
  ];

  var container = document.querySelector('#tabs');
  content.forEach(function(c, i) {
    var tab = document.createElement('div');

    tab.classList.add('tab');
    tab.classList.toggle('current', i === 0);
    tab.innerHTML = `
      <div class="url">
        ${c.url}
      </div>
      <div class="iframe"></div>
      <div class="chrome">
        <div class="navigation">
          &lt;
        </div>
        <div class="home">
          ⌂
        </div>
        <div class="menu">
          ▤
        </div>
      </div>
    `;

    container.appendChild(tab);
  });

  var newTab = document.createElement('div');
  newTab.id = 'new-tab';
  newTab.textContent = '+';
  container.appendChild(newTab);
});
