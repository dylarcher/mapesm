// Secondary Adapter - Simple Event Publisher
const EventPublisherPort = require('../../application/ports/secondary/EventPublisherPort');

class SimpleEventPublisher extends EventPublisherPort {
  constructor() {
    super();
    this.events = [];
    this.subscribers = new Map();
  }

  async publishEvent(eventName, eventData, metadata = {}) {
    const event = {
      id: this.generateEventId(),
      name: eventName,
      data: eventData,
      metadata: {
        ...metadata,
        timestamp: new Date(),
        source: 'SimpleEventPublisher'
      }
    };

    this.events.push(event);

    console.log(`🎯 EVENT PUBLISHED: ${eventName}`);
    console.log(`   Event ID: ${event.id}`);
    console.log(`   Data: ${JSON.stringify(eventData, null, 2)}`);
    console.log(`   Timestamp: ${event.metadata.timestamp.toISOString()}\n`);

    // Notify subscribers
    const eventSubscribers = this.subscribers.get(eventName) || [];
    for (const subscriber of eventSubscribers) {
      try {
        await subscriber(event);
      } catch (error) {
        console.error(`Error notifying subscriber for event ${eventName}:`, error);
      }
    }

    return event;
  }

  async publishProductEvent(eventType, product, metadata = {}) {
    const eventName = `Product.${eventType}`;
    const eventData = {
      productId: product.id,
      productName: product.name,
      productCategory: product.category,
      productPrice: product.price,
      product: product.toJSON()
    };

    return await this.publishEvent(eventName, eventData, metadata);
  }

  subscribe(eventName, handler) {
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, []);
    }

    this.subscribers.get(eventName).push(handler);

    console.log(`📝 Subscribed to event: ${eventName}`);
  }

  unsubscribe(eventName, handler) {
    const eventSubscribers = this.subscribers.get(eventName);
    if (eventSubscribers) {
      const index = eventSubscribers.indexOf(handler);
      if (index > -1) {
        eventSubscribers.splice(index, 1);
        console.log(`🔕 Unsubscribed from event: ${eventName}`);
      }
    }
  }

  getEventHistory() {
    return [...this.events];
  }

  getEventsByName(eventName) {
    return this.events.filter(event => event.name === eventName);
  }

  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = SimpleEventPublisher;
