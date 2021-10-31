import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '@/app/schemas/User';
import Mailer from '@/modules/Mailer';
import authConfig from '@/config/auth';

const router = new Router();

const generateToken = (params) => {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 86400,
  });
};

//Registrar user
router.post('/register', (req, res) => {
  const { email, name, password } = req.body;

  User.findOne({ email })
    .then((userData) => {
      if (userData) {
        return res.status(400).send({ error: 'User already exists' });
      } else {
        User.create({ name, email, password })
          .then((user) => {
            user.password = undefined;
            return res.send({ user });
          })
          .catch((error) => {
            console.error('Erro ao salvar usuário', error);
            return res.status(400).send({ error: 'Registration failed' });
          });
      }
    })
    .catch((error) => {
      console.log('Erro ao consultar usuário no banco de dados', error);
      return res.status(500).send({ error: 'Registration failed' });
    });
});

//Fazer o login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  User.findOne({ email })
    .select('+password')
    .then((user) => {
      if (user) {
        bcrypt
          .compare(password, user.password)
          .then((result) => {
            if (result) {
              const token = generateToken({ uid: user.id });
              return res.send({ token: token, tokenExpiration: '1d' });
            } else {
              return res.status(400).send({ error: 'invalid password' });
            }
          })
          .catch((error) => {
            console.error('Erro ao verificar senha', error);
            return res.status(500).send({ error: 'internal server error' });
          });
      } else {
        return res.status(404).send({ error: 'user not found' });
      }
    })
    .catch((erro) => {
      console.error('Erro ao logar', erro);
      return res.status(500).send({ error: 'Internal server error' });
    });
});

//Enviar email com o token
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  User.findOne({ email })
    .then((user) => {
      if (user) {
        const token = crypto.randomBytes(20).toString('hex');
        const expiration = new Date();
        expiration.setHours(new Date().getHours() + 3);

        User.findByIdAndUpdate(user.id, {
          $set: {
            passwordResetToken: token,
            passwordResetTokenExpiration: expiration,
          },
        })
          .then(() => {
            Mailer.sendMail(
              {
                to: email,
                from: 'webmaster@testeexpress.com',
                template: 'auth/forgot_password',
                context: { token },
                
              },
              (error) => {
                if (error) {
                  console.error('Erro ao enviar email', error);
                  return res
                    .status(400)
                    .send({ error: 'Fail sending recover password mail' });
                } else {
                  return res.send();
                }
              },
            );
            return res
            .status(200)
            .send({ message: 'Chave de recuperação enviada com sucesso. Verifique seu email!' });
          })
          .catch((error) => {
            console.error(
              'Erro ao salvar o token de recuperação de senha',
              error,
            );
            return res.status(500).send({ error: 'Internal server error' });
          });
      } else {
        return res.status(404).send({ error: 'User not found' });
      }
    })
    .catch((error) => {
      console.error('Erro no forgot password', error);
      return res.status(500).send({ error: 'Internal server error' });
    });
});

//Mudar a senha
router.post('/reset-password', (req, res) => {
  const { email, token, newPassword } = req.body;

  User.findOne({ email })
    .select('+passwordResetToken passwordResetTokenExpiration')
    .then((user) => {
      if (user) {
        if (
          token != user.passwordResetToken ||
          new Date().now > user.passwordResetTokenExpiration
        ) {
          return res.status(400).send({ error: 'Invalid token' });
        } else {
          user.passwordResetToken = undefined;
          user.passwordResetTokenExpiration = undefined;
          user.password = newPassword;

          user
            .save()
            .then(() => {
              res.send({ message: 'Senha trocada com sucesso' });
            })
            .catch((error) => {
              console.error('Erro ao salvar nova senha do usuário', error);
              return res.status(500).send({ error: 'Internal server error' });
            });
        }
      } else {
        return res.status(404).send({ error: 'User not found' });
      }
    })
    .catch((error) => {
      console.error('Erro no forgot password', error);
      return res.status(500).send({ error: 'Internal server error' });
    });
});

export default router;
