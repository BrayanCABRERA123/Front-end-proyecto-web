const jsonServer = require('json-server');
const jwt = require('jsonwebtoken');

// MOCK ONLY: fixed dev secret, plaintext passwords in db.json. Never do this against a real backend.
const JWT_SECRET = 'mock-dev-secret-do-not-use-in-production';
const JWT_EXPIRES_IN = '2h';

const server = jsonServer.create();
const router = jsonServer.router('mock-api/db.json');
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);

server.post('/login', (req, res) => {
  const { correo, contrasena } = req.body;
  const user = router.db.get('users').find({ correo }).value();

  if (!user || user.contrasena !== contrasena) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const accessToken = jwt.sign(
    { sub: user.id, correo: user.correo, rol: user.rol },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const { contrasena: _omit, ...userSafe } = user;
  res.status(200).json({ accessToken, user: userSafe });
});

server.use(router);

server.listen(3000, () => {
  console.log('Mock API with JWT login running on http://localhost:3000');
});
