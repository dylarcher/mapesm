// Notification Application Service
class NotificationApplicationService {
  constructor() {
    this.notifications = [];
  }

  async sendNotification(type, recipient, message) {
    const notification = {
      id: this.notifications.length + 1,
      type,
      recipient,
      message,
      status: 'pending',
      createdAt: new Date()
    };

    this.notifications.push(notification);

    // Simulate sending notification
    setTimeout(() => {
      notification.status = 'sent';
      notification.sentAt = new Date();
      console.log(`📨 ${type.toUpperCase()} notification sent to ${recipient}: ${message}`);
    }, 100);

    return notification;
  }

  getNotificationHistory(recipient) {
    return this.notifications.filter(n => n.recipient === recipient);
  }

  getNotificationById(id) {
    return this.notifications.find(n => n.id === id);
  }

  async markAsRead(notificationId) {
    const notification = this.getNotificationById(notificationId);
    if (notification) {
      notification.status = 'read';
      notification.readAt = new Date();
    }
    return notification;
  }
}

module.exports = NotificationApplicationService;
