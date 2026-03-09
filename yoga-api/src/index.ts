import 'dotenv/config';
import { createServer } from 'node:http';
import { createYoga } from 'graphql-yoga';
import { schema } from './schema/index.js';
import { prisma } from './db/client.js';

const yoga = createYoga({
  schema,
  graphiql: process.env.NODE_ENV !== 'production',
  cors: { origin: ['http://localhost:3080'], credentials: true },
});

const server = createServer((req, res) => {
  const match = req.url?.match(/^\/api\/applications\/([^/?]+)/);
  if (req.method === 'DELETE' && match) {
    const id = match[1];
    prisma.application.delete({ where: { id } })
      .then(() => { res.writeHead(204); res.end(); })
      .catch(() => { res.writeHead(404); res.end(); });
    return;
  }
  yoga(req, res);
});

const port = Number(process.env.PORT ?? 5080);
server.listen(port, () => {
  console.log(`GraphQL Yoga running at http://localhost:${port}/graphql`);
});
