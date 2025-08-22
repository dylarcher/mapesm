// Main entry point for flat structure test
import { api } from './api.js';
import { auth } from './auth.js';
import { cache } from './cache.js';
import { config } from './config.js';
import { logger } from './logger.js';
import { utils } from './utils.js';
import { validation } from './validation.js';

export function initialize() {
  logger.info('Initializing application...');

  const settings = config.load();
  auth.setup(settings.auth);
  api.configure(settings.api);
  cache.initialize();

  logger.info('Application initialized successfully');
}

export function processData(data) {
  if (!validation.isValid(data)) {
    throw new Error('Invalid data provided');
  }

  const processed = utils.transform(data);
  cache.store('lastProcessed', processed);

  return processed;
}

export { api, auth, cache, config, logger, utils, validation };

