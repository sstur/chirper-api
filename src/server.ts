import expressPlayground from 'graphql-playground-middleware-express';
import { createServer } from '@graphql-yoga/node';
import type { Application } from 'express';

import { schema } from './graphql/schema';
import { db } from './db';

export function attachHandlers(app: Application) {
  app.disable('x-powered-by');
  const server = createServer({
    schema,
    graphiql: false,
    context: ({ request }) => {
      const context = {
        getSession: async () => {
          const authHeader = request.headers.get('Authorization') ?? '';
          const sessionId = authHeader.replace(/^Bearer /i, '');
          return await db.Session.getById(sessionId);
        },
        getCurrentUser: async () => {
          const session = await context.getSession();
          return await db.User.getById(session?.user ?? '');
        },
        authenticate: async () => {
          const user = await context.getCurrentUser();
          if (!user) {
            throw new Error('Not authenticated');
          }
          return user;
        },
      };
      return context;
    },
  });
  app.use('/graphql', server);
  app.get('/playground', expressPlayground({ endpoint: '/graphql' }));
}
