// Secondary Port - Event Publisher Interface
class EventPublisherPort {
  async publishEvent(eventName, eventData, metadata = {}) {
    throw new Error('Method must be implemented by adapter');
  }

  async publishProductEvent(eventType, product, metadata = {}) {
    throw new Error('Method must be implemented by adapter');
  }
}

module.exports = EventPublisherPort;
