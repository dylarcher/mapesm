// Secondary Port - Notification Service Interface
class NotificationServicePort {
  async sendNotification(type, recipient, message, data = {}) {
    throw new Error('Method must be implemented by adapter');
  }

  async sendEmailNotification(recipient, subject, body) {
    throw new Error('Method must be implemented by adapter');
  }

  async sendSMSNotification(phoneNumber, message) {
    throw new Error('Method must be implemented by adapter');
  }
}

module.exports = NotificationServicePort;
