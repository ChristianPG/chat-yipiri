import express from 'express';

const port = process.env.PORT ?? 3000;
const app = express();

app.get('/', (_req, res) => {
  res.sendFile(process.cwd() + '/client/index.html');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
