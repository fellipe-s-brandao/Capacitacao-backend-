import express from 'express';
import { Portifolio, Auth } from './app/controllers';

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/portifolio', Portifolio);
app.use('/auth', Auth);


console.log(`servindor rodando no http://localhost:${port}`);
app.listen(port);
