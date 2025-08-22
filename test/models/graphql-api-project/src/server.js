// GraphQL API Pattern - Main Schema and Server
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import { buildSchema } from 'graphql';
import { useServer } from 'graphql-ws/lib/use/ws';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Type definitions
import { typeDefs } from './schema/typeDefs.js';

// Resolvers
import { commentResolvers } from './resolvers/commentResolvers.js';
import { postResolvers } from './resolvers/postResolvers.js';
import { userResolvers } from './resolvers/userResolvers.js';

// Data sources
import { CommentDataSource } from './datasources/CommentDataSource.js';
import { PostDataSource } from './datasources/PostDataSource.js';
import { UserDataSource } from './datasources/UserDataSource.js';

// Middleware
import { authMiddleware } from './middleware/auth.js';

// Utilities
import { createContext } from './utils/context.js';
import { formatError } from './utils/errorHandler.js';
import { logger } from './utils/logger.js';

class GraphQLServer {
  constructor(config = {}) {
    this.config = {
      port: 4000,
      playground: true,
      introspection: true,
      subscriptions: {
        path: '/graphql',
        onConnect: this.onConnect.bind(this),
        onDisconnect: this.onDisconnect.bind(this),
      },
      ...config
    };

    this.app = express();
    this.httpServer = null;
    this.apolloServer = null;
    this.wsServer = null;

    this.dataSources = {
      userAPI: new UserDataSource(),
      postAPI: new PostDataSource(),
      commentAPI: new CommentDataSource()
    };
  }

  async initialize() {
    try {
      // Create HTTP server
      this.httpServer = createServer(this.app);

      // Setup middleware
      this.setupMiddleware();

      // Create Apollo Server
      await this.createApolloServer();

      // Setup WebSocket server for subscriptions
      this.setupWebSocketServer();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      logger.info('GraphQL server initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize GraphQL server:', error);
      throw error;
    }
  }

  setupMiddleware() {
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.url}`, {
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
      next();
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
      });
    });

    // GraphQL endpoint info
    this.app.get('/', (req, res) => {
      res.json({
        message: 'GraphQL API Server',
        endpoints: {
          graphql: '/graphql',
          playground: this.config.playground ? '/graphql' : null,
          subscriptions: 'ws://localhost:' + this.config.port + '/graphql'
        },
        version: '1.0.0'
      });
    });
  }

  async createApolloServer() {
    // Merge all resolvers
    const resolvers = {
      Query: {
        ...userResolvers.Query,
        ...postResolvers.Query,
        ...commentResolvers.Query
      },
      Mutation: {
        ...userResolvers.Mutation,
        ...postResolvers.Mutation,
        ...commentResolvers.Mutation
      },
      Subscription: {
        ...userResolvers.Subscription,
        ...postResolvers.Subscription,
        ...commentResolvers.Subscription
      },
      // Type resolvers
      User: userResolvers.User || {},
      Post: postResolvers.Post || {},
      Comment: commentResolvers.Comment || {}
    };

    // Create Apollo Server
    this.apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      dataSources: () => this.dataSources,
      context: createContext,
      formatError,
      plugins: [
        // Custom plugins
        {
          requestDidStart() {
            return {
              didResolveOperation(requestContext) {
                logger.info('GraphQL Operation:', {
                  operationName: requestContext.request.operationName,
                  query: requestContext.request.query,
                  variables: requestContext.request.variables
                });
              },
              didEncounterErrors(requestContext) {
                logger.error('GraphQL Errors:', requestContext.errors);
              }
            };
          }
        },
        // Performance monitoring
        {
          requestDidStart() {
            return {
              willSendResponse(requestContext) {
                const { response } = requestContext;
                if (response.extensions) {
                  response.extensions.timestamp = new Date().toISOString();
                }
              }
            };
          }
        }
      ],
      introspection: this.config.introspection,
      playground: this.config.playground ? {
        settings: {
          'request.credentials': 'include',
          'schema.polling.enable': false,
        },
        tabs: [
          {
            endpoint: '/graphql',
            query: this.getExampleQuery()
          }
        ]
      } : false,
      subscriptions: false // We'll handle subscriptions with graphql-ws
    });

    await this.apolloServer.start();
    this.apolloServer.applyMiddleware({
      app: this.app,
      path: '/graphql',
      cors: false // We handle CORS ourselves
    });

    logger.info('Apollo Server created and middleware applied');
  }

  setupWebSocketServer() {
    // Create WebSocket server
    this.wsServer = new WebSocketServer({
      server: this.httpServer,
      path: '/graphql',
    });

    // Use the server for subscriptions
    const serverCleanup = useServer({
      schema: buildSchema(typeDefs),
      onConnect: this.onConnect.bind(this),
      onDisconnect: this.onDisconnect.bind(this),
      context: async (ctx, msg, args) => {
        return createContext({ connection: ctx });
      }
    }, this.wsServer);

    logger.info('WebSocket server setup for GraphQL subscriptions');
  }

  async onConnect(connectionParams) {
    logger.info('WebSocket connection established', { connectionParams });

    // Authentication for subscriptions
    if (connectionParams.authorization) {
      try {
        const user = await authMiddleware.verifyToken(connectionParams.authorization);
        return { user };
      } catch (error) {
        logger.error('WebSocket authentication failed:', error);
        throw new Error('Authentication failed');
      }
    }

    return {};
  }

  onDisconnect(webSocket, context) {
    logger.info('WebSocket connection closed');
  }

  async start() {
    try {
      await this.initialize();

      this.httpServer.listen(this.config.port, () => {
        logger.info(`🚀 GraphQL server ready at http://localhost:${this.config.port}/graphql`);
        logger.info(`🔗 GraphQL subscriptions ready at ws://localhost:${this.config.port}/graphql`);

        if (this.config.playground) {
          logger.info(`🎮 GraphQL Playground available at http://localhost:${this.config.port}/graphql`);
        }
      });

      return this.httpServer;

    } catch (error) {
      logger.error('Failed to start GraphQL server:', error);
      throw error;
    }
  }

  async stop() {
    try {
      if (this.apolloServer) {
        await this.apolloServer.stop();
        logger.info('Apollo Server stopped');
      }

      if (this.wsServer) {
        this.wsServer.close();
        logger.info('WebSocket server stopped');
      }

      if (this.httpServer) {
        await new Promise((resolve) => {
          this.httpServer.close(resolve);
        });
        logger.info('HTTP server stopped');
      }

      // Close data sources
      await Promise.all(
        Object.values(this.dataSources).map(dataSource => {
          if (dataSource.close) {
            return dataSource.close();
          }
        })
      );

      logger.info('GraphQL server stopped successfully');

    } catch (error) {
      logger.error('Error stopping GraphQL server:', error);
      throw error;
    }
  }

  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);

      try {
        await this.stop();
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }

  getExampleQuery() {
    return `query GetUsersAndPosts {
  users(limit: 5) {
    id
    name
    email
    posts {
      id
      title
      content
      comments {
        id
        content
        author {
          name
        }
      }
    }
  }
}

mutation CreateUser {
  createUser(input: {
    name: "John Doe"
    email: "john@example.com"
  }) {
    id
    name
    email
  }
}

subscription UserCreated {
  userCreated {
    id
    name
    email
  }
}`;
  }

  // Health and metrics
  getMetrics() {
    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      apolloServerVersion: this.apolloServer?.apolloConfig?.version,
      activeConnections: this.wsServer?.clients?.size || 0,
      dataSources: Object.keys(this.dataSources)
    };
  }

  async healthCheck() {
    try {
      // Check data source connections
      const dataSourceHealth = await Promise.all(
        Object.entries(this.dataSources).map(async ([name, dataSource]) => {
          try {
            const health = dataSource.healthCheck ? await dataSource.healthCheck() : { status: 'unknown' };
            return { name, ...health };
          } catch (error) {
            return { name, status: 'unhealthy', error: error.message };
          }
        })
      );

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: {
          port: this.config.port,
          playground: this.config.playground,
          subscriptions: !!this.wsServer
        },
        dataSources: dataSourceHealth,
        metrics: this.getMetrics()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export { GraphQLServer };
