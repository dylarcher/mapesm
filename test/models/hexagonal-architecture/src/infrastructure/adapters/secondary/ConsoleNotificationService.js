// Secondary Adapter - Console Notification Service
const NotificationServicePort = require('../../application/ports/secondary/NotificationServicePort');

class ConsoleNotificationService extends NotificationServicePort {
  constructor() {
    super();
    this.notifications = [];
  }

  async sendNotification(type, recipient, message, data = {}) {
    const notification = {
      id: this.generateId(),
      type,
      recipient,
      message,
      data,
      timestamp: new Date(),
      status: 'sent'
    };

    this.notifications.push(notification);

    console.log(`📧 NOTIFICATION [${type.toUpperCase()}]`);
    console.log(`   To: ${recipient}`);
    console.log(`   Message: ${message}`);
    if (Object.keys(data).length > 0) {
      console.log(`   Data: ${JSON.stringify(data)}`);
    }
    console.log(`   Sent at: ${notification.timestamp.toISOString()}\n`);

    return notification;
  }

  async sendEmailNotification(recipient, subject, body) {
    const notification = {
      id: this.generateId(),
      type: 'email',
      recipient,
      subject,
      body,
      timestamp: new Date(),
      status: 'sent'
    };

    this.notifications.push(notification);

    console.log(`📧 EMAIL NOTIFICATION`);
    console.log(`   To: ${recipient}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${body}`);
    console.log(`   Sent at: ${notification.timestamp.toISOString()}\n`);

    return notification;
  }

  async sendSMSNotification(phoneNumber, message) {
    const notification = {
      id: this.generateId(),
      type: 'sms',
      recipient: phoneNumber,
      message,
      timestamp: new Date(),
      status: 'sent'
    };

    this.notifications.push(notification);

    console.log(`📱 SMS NOTIFICATION`);
    console.log(`   To: ${phoneNumber}`);
    console.log(`   Message: ${message}`);
    console.log(`   Sent at: ${notification.timestamp.toISOString()}\n`);

    return notification;
  }

  getNotificationHistory() {
    return [...this.notifications];
  }

  getNotificationsByType(type) {
    return this.notifications.filter(n => n.type === type);
  }

  generateId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = ConsoleNotificationService;
