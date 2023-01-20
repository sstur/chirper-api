import express from 'express';
import { attachHandlers } from './server';

const PORT = 3000;

const app = express();

attachHandlers(app);

app.get('/', (request, response) => {
  response.send(
    `<p>Open to the <a href="/playground">GraphQL Playground</a></p>`,
  );
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
