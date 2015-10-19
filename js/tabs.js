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

    tab.classList.toggle('current', i === 0);

    tab.innerHTML = `
      <div class="frame">
        <div class="url">
          ${c.url}
        </div>
        <div class="iframe"></div>
        <div class="home-filler"></div>
      </div>
    `;

    container.appendChild(tab);
  });
});
