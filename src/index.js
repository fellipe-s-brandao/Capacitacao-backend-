import express from 'express';
import { Portifolio } from './app/controllers';

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/portifolio', Portifolio);

console.log(`servindor rodando no http://localhost:${port}`);
app.listen(port);
