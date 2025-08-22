// Message Broker for inter-service communication
import { EventEmitter } from 'events';

export class MessageBroker extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.subscriptions = new Map();
    this.messageQueue = [];
    this.processing = false;
    this.retryAttempts = new Map();

    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  async publish(eventType, data, options = {}) {
    const message = {
      id: this.generateMessageId(),
      type: eventType,
      data,
      timestamp: new Date(),
      source: options.source || 'unknown',
      correlationId: options.correlationId,
      retry: 0
    };

    this.messageQueue.push(message);

    if (!this.processing) {
      this.processQueue();
    }

    console.log(`Message published: ${eventType}`);
    return message.id;
  }

  async subscribe(eventType, handler, options = {}) {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    const subscription = {
      handler,
      options: {
        persistent: options.persistent || false,
        autoAck: options.autoAck !== false,
        retries: options.retries || this.maxRetries
      }
    };

    this.subscriptions.get(eventType).push(subscription);

    console.log(`Subscribed to event: ${eventType}`);
    return subscription;
  }

  async unsubscribe(eventType, handler) {
    if (this.subscriptions.has(eventType)) {
      const subscriptions = this.subscriptions.get(eventType);
      const index = subscriptions.findIndex(sub => sub.handler === handler);

      if (index !== -1) {
        subscriptions.splice(index, 1);
        console.log(`Unsubscribed from event: ${eventType}`);
        return true;
      }
    }

    return false;
  }

  async processQueue() {
    this.processing = true;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();

      try {
        await this.deliverMessage(message);
      } catch (error) {
        console.error(`Failed to deliver message ${message.id}:`, error);

        // Handle retry logic
        if (message.retry < this.maxRetries) {
          message.retry += 1;

          // Add delay before retry
          setTimeout(() => {
            this.messageQueue.push(message);
          }, this.retryDelay * message.retry);

          console.log(`Message ${message.id} scheduled for retry ${message.retry}`);
        } else {
          console.error(`Message ${message.id} failed after ${this.maxRetries} retries`);
          this.emit('messageFailed', message, error);
        }
      }
    }

    this.processing = false;
  }

  async deliverMessage(message) {
    const subscribers = this.subscriptions.get(message.type) || [];

    if (subscribers.length === 0) {
      console.warn(`No subscribers for event type: ${message.type}`);
      return;
    }

    const deliveryPromises = subscribers.map(async (subscription) => {
      try {
        const result = await subscription.handler({
          id: message.id,
          type: message.type,
          data: message.data,
          timestamp: message.timestamp,
          source: message.source,
          correlationId: message.correlationId
        });

        if (subscription.options.autoAck) {
          this.ack(message.id);
        }

        return result;

      } catch (error) {
        console.error(`Handler error for ${message.type}:`, error);

        if (subscription.options.retries > 0) {
          throw error; // Trigger retry
        }

        this.emit('handlerError', {
          message,
          subscription,
          error
        });
      }
    });

    await Promise.allSettled(deliveryPromises);
  }

  ack(messageId) {
    // Acknowledge message processing
    console.log(`Message acknowledged: ${messageId}`);
  }

  nack(messageId, requeue = true) {
    // Negative acknowledge - reject message
    console.log(`Message rejected: ${messageId}, requeue: ${requeue}`);
  }

  // Request-Response pattern
  async request(eventType, data, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const correlationId = this.generateCorrelationId();
      const responseEventType = `${eventType}.response`;

      // Set up response handler
      const responseHandler = (event) => {
        if (event.correlationId === correlationId) {
          this.unsubscribe(responseEventType, responseHandler);
          clearTimeout(timeoutHandle);

          if (event.data.success) {
            resolve(event.data.result);
          } else {
            reject(new Error(event.data.error));
          }
        }
      };

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        this.unsubscribe(responseEventType, responseHandler);
        reject(new Error(`Request timeout for ${eventType}`));
      }, timeout);

      // Subscribe to response
      this.subscribe(responseEventType, responseHandler);

      // Send request
      this.publish(eventType, data, { correlationId });
    });
  }

  // Utility methods
  generateMessageId() {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateCorrelationId() {
    return `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Health and monitoring
  getQueueStats() {
    return {
      queueLength: this.messageQueue.length,
      processing: this.processing,
      subscriptionCount: Array.from(this.subscriptions.values()).reduce((sum, subs) => sum + subs.length, 0),
      totalSubscriptions: this.subscriptions.size
    };
  }

  async start() {
    console.log('Message Broker started');
    this.emit('started');
  }

  async stop() {
    // Wait for queue to empty
    while (this.messageQueue.length > 0 && this.processing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.subscriptions.clear();
    console.log('Message Broker stopped');
    this.emit('stopped');
  }
}
