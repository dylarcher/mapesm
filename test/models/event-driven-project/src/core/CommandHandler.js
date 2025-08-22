// Command Handler - CQRS Pattern Implementation
class CommandHandler {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.handlers = new Map();
  }

  register(commandName, handler) {
    this.handlers.set(commandName, handler);
    console.log(`⚙️ Registered command handler: ${commandName}`);
  }

  async execute(commandName, commandData) {
    const handler = this.handlers.get(commandName);
    if (!handler) {
      throw new Error(`No handler found for command: ${commandName}`);
    }

    console.log(`⚡ Executing command: ${commandName}`);

    try {
      const result = await handler(commandData);

      // Publish command executed event
      await this.eventBus.publish('CommandExecuted', {
        commandName,
        commandData,
        result,
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      // Publish command failed event
      await this.eventBus.publish('CommandFailed', {
        commandName,
        commandData,
        error: error.message,
        timestamp: new Date()
      });

      throw error;
    }
  }
}

module.exports = CommandHandler;
