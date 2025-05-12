function showNotification(message, category = 'info') {
    const container = document.getElementById('notifications-container');
    const notification = document.createElement('div');
    notification.className = `notification ${category} show`;
    notification.textContent = message;
    container.appendChild(notification);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => container.removeChild(notification), 500);
    }, 4000);
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    fetch('/get_notifications')
      .then((response) => response.json())
      .then((notifications) => {
        notifications.forEach((notif) => {
          showNotification(notif.message, notif.category);
        });
      })
      .catch((err) => console.error('Ошибка загрузки уведомлений:', err));
  });
  