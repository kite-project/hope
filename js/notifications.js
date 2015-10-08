window.addEventListener('DOMContentLoaded', function() {
  var content = [];
  for (var i = 1; i <= 42; i++) {
    content.push({
      title: 'Notification number ' + i,
      body: 'Lorem ipsum tralala'
    });
  }

  var container = document.querySelector('#notifications ul');
  content.forEach(function(c) {
    var notification = document.createElement('li');

    notification.innerHTML = `
      <h3>${c.title}</h3>
      <p>${c.body}</p>
    `;

    container.appendChild(notification);
  });
});
