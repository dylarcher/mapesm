// Event Bus - Core component for event-driven architecture
const { EventEmitter } = require('events');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.eventStore = [];
    this.subscriptions = new Map();
  }

  async publish(eventName, eventData) {
    const event = {
      id: this.generateEventId(),
      name: eventName,
      data: eventData,
      timestamp: new Date(),
      version: 1
    };

    // Store event for event sourcing
    this.eventStore.push(event);

    console.log(`📡 Publishing event: ${eventName}`);

    // Emit event to subscribers
    this.emit(eventName, event);

    // Also emit to wildcard subscribers
    this.emit('*', event);

    return event;
  }

  subscribe(eventName, handler, options = {}) {
    const subscription = {
      id: this.generateEventId(),
      eventName,
      handler,
      options
    };

    if (!this.subscriptions.has(eventName)) {
      this.subscriptions.set(eventName, []);
    }

    this.subscriptions.get(eventName).push(subscription);
    this.on(eventName, handler);

    console.log(`📝 Subscribed to event: ${eventName}`);

    return subscription.id;
  }

  unsubscribe(subscriptionId) {
    for (const [eventName, subs] of this.subscriptions.entries()) {
      const index = subs.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        const subscription = subs[index];
        this.off(eventName, subscription.handler);
        subs.splice(index, 1);
        console.log(`🔕 Unsubscribed from event: ${eventName}`);
        return true;
      }
    }
    return false;
  }

  getEventHistory(eventName = null) {
    if (eventName) {
      return this.eventStore.filter(event => event.name === eventName);
    }
    return [...this.eventStore];
  }

  replay(fromTimestamp) {
    const eventsToReplay = this.eventStore.filter(
      event => event.timestamp >= fromTimestamp
    );

    console.log(`🔄 Replaying ${eventsToReplay.length} events`);

    eventsToReplay.forEach(event => {
      this.emit(event.name, event);
    });
  }

  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = EventBus;
