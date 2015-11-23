window.addEventListener('DOMContentLoaded', function() {
  var content = [];
  for (var i = 1; i <= 42; i++) {
    content.push({
      title: 'Notification number ' + i,
      body: 'Lorem ipsum tralala',
      icon: `notification-icon-${parseInt(Math.random() * 10 % 8)}.png`,
      time: `${parseInt(Math.random() * 100 % 12)}:${parseInt(Math.random() * 100 % 60)} ${(Math.random() > 0.5) ? 'a' : 'p'}`
    });
  }

  var container = document.querySelector('#notifications ul');
  content.forEach(function(c) {
    var notification = document.createElement('li');

    notification.innerHTML = `
      <img src="assets/${c.icon}" />
      <h3>${c.title}</h3>
      <p>${c.body}</p>
      <span>${c.time}</span>
    `;

    container.appendChild(notification);
  });
});
