import { Router } from 'express';
import Project from '@/app/Schemas/Project';
import Slugify from '../../utils/Slugify';
import AuthMiddleware from '@/app/middlewares/Auth';

const router = Router();

router.get('/', (request, response) => {
  Project.find()
    .then((data) => {
      const projects = data.map((project) => {
        return { title: project.title, category: project.category };
      });
      response.send(projects);
    })
    .catch((error) => {
      console.error('Erro ao obter os dados do projeto', error);
      response.status(400).send({
        error: 'Não foi possível obter os dados do projeto. Tente novamente.',
      });
    });
});

router.get('/procura/:projectSlug', (request, response) => {
  Project.findOne({ slug: request.params.projectSlug })
    .then((project) => {
      if (project) {
        response.send(project);
      } else {
        console.error('Projeto não encontrado');
        return response.status(404).send({ error: 'Projeto não encontrado' });
      }
    })
    .catch((error) => {
      console.error('Erro ao obter os dados do projeto', error);
      response.status(400).send({
        error: 'Não foi possível obter os dados do projeto. Tente novamente.',
      });
    });
});

router.post('/insere', AuthMiddleware, (request, response) => {
  const { title, slug, description, category } = request.body;
  Project.create({ title, slug, description, category })
    .then((project) => {
      response.status(200).send(project);
    })
    .catch((error) => {
      console.error('Erro ao salvar no banco de Dados', error);
      response.status(400).send({
        error:
          'Não foi possível salvar seu projeto. Verifique os dados e tente novamente.',
      });
    });
});

router.put('/atualiza/:projectId', AuthMiddleware, (request, response) => {
  const { title, description, category } = request.body;
  let slug = undefined;
  if (title) {
    slug = Slugify(title);
  }

  Project.findByIdAndUpdate(
    request.params.projectId,
    {
      title,
      description,
      slug,
      category,
    },
    { new: true },
  )
    .then((project) => {
      response.status(200).send(project);
    })
    .catch((error) => {
      console.error('Erro ao atualizar projeto no banco de Dados', error);
      response.status(400).send({
        error:
          'Não foi possível atualizar seu projeto. Verifique os dados e tente novamente.',
      });
    });
});

router.delete('/delete/:projectId', AuthMiddleware, (request, response) => {
  Project.findByIdAndRemove(request.params.projectId)
    .then(() => {
      response.send({ message: 'Projeto removido com sucesso.' });
    })
    .catch((error) => {
      console.error('Erro ao remover projeto', error);
      response.status(400).send({ message: 'Erro ao remover projeto.' });
    });
});

export default router;
