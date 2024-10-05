const express = require('express');
const crypto = require('crypto');
const app = express();
const port = 3000;

app.use(express.json());

// Estado de usuarios, almacenamos en memoria para este ejemplo
const users = {};

// Lista de preguntas con sus respuestas
const questions = [
  { question: "¿Cuánto es 25 + 17?", answer: 42 },
  { question: "¿Cuál es el cuadrado de 9?", answer: 81 },
  { question: "¿Cuántos días tiene un mes?", answer: 30 },
  { question: "¿Cuántas patas tiene un perro?", answer: 4 }
];

// Función para encriptar el mensaje con una clave
function encryptMessage(seed) {
  const cipher = crypto.createCipher('aes-256-cbc', seed); // Semilla es la clave
  let encrypted = cipher.update('Feliz cumpleaños!', 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Generar un ID único para el usuario (en este caso usaremos un timestamp como ID)
function generateUserId() {
  return Date.now().toString(36);  // ID único basado en el timestamp
}

// Verificar respuestas y actualizar el estado del usuario
function validateAnswer(userId, key, answer) {
  const user = users[userId];

  // Verificamos si la respuesta es correcta
  const questionIndex = parseInt(key.replace('key', '')) - 1;
  if (parseInt(answer) === questions[questionIndex].answer) {
    user[key] = { status: 'pass', value: answer };
  } else {
    user[key] = { status: 'fail', value: '' };
  }

  // Verificamos si el usuario está listo para decriptar
  user.readyForDecript = user.key1.status === 'pass' &&
                         user.key2.status === 'pass' &&
                         user.key3.status === 'pass' &&
                         user.key4.status === 'pass';
}

// Middleware para crear un usuario si no existe
function getUser(req, res, next) {
  const userId = req.get('User-Agent') || generateUserId();  // Usamos el user-agent como ID de sesión
  if (!users[userId]) {
    users[userId] = {
      key1: { status: 'fail', value: '' },
      key2: { status: 'fail', value: '' },
      key3: { status: 'fail', value: '' },
      key4: { status: 'fail', value: '' },
      readyForDecript: false
    };
  }
  req.userId = userId;
  next();
}

// Pregunta correspondiente a cada key
app.get('/key1', getUser, (req, res) => {
  const user = users[req.userId];
  if (user.key1.status === 'fail') {
    res.json({ question: questions[0].question });
  } else {
    res.json({ message: 'Ya has respondido correctamente esta pregunta.' });
  }
});

app.get('/key2', getUser, (req, res) => {
  const user = users[req.userId];
  if (user.key2.status === 'fail') {
    res.json({ question: questions[1].question });
  } else {
    res.json({ message: 'Ya has respondido correctamente esta pregunta.' });
  }
});

app.get('/key3', getUser, (req, res) => {
  const user = users[req.userId];
  if (user.key3.status === 'fail') {
    res.json({ question: questions[2].question });
  } else {
    res.json({ message: 'Ya has respondido correctamente esta pregunta.' });
  }
});

app.get('/key4', getUser, (req, res) => {
  const user = users[req.userId];
  if (user.key4.status === 'fail') {
    res.json({ question: questions[3].question });
  } else {
    res.json({ message: 'Ya has respondido correctamente esta pregunta.' });
  }
});

// Enviar respuesta a la pregunta
app.post('/key1', getUser, (req, res) => {
  const { answer } = req.body;
  validateAnswer(req.userId, 'key1', answer);
  const user = users[req.userId];
  res.json({ status: user.key1.status === 'pass' ? 'resp correcta' : 'resp incorrecta' });
});

app.post('/key2', getUser, (req, res) => {
  const { answer } = req.body;
  validateAnswer(req.userId, 'key2', answer);
  const user = users[req.userId];
  res.json({ status: user.key2.status === 'pass' ? 'resp correcta' : 'resp incorrecta' });
});

app.post('/key3', getUser, (req, res) => {
  const { answer } = req.body;
  validateAnswer(req.userId, 'key3', answer);
  const user = users[req.userId];
  res.json({ status: user.key3.status === 'pass' ? 'resp correcta' : 'resp incorrecta' });
});

app.post('/key4', getUser, (req, res) => {
  const { answer } = req.body;
  validateAnswer(req.userId, 'key4', answer);
  const user = users[req.userId];
  res.json({ status: user.key4.status === 'pass' ? 'resp correcta' : 'resp incorrecta' });
});

// Endpoint para desencriptar el mensaje si el usuario está listo
app.post('/decript', getUser, (req, res) => {
  const user = users[req.userId];

  if (user.readyForDecript) {
    const { key1, key2, key3, key4 } = user;
    const seed = key1.value + key2.value + key3.value + key4.value;
    const decryptedMessage = encryptMessage(seed); // Desencriptar con la clave
    res.json({ message: 'Feliz cumpleaños!', encryptedMessage: decryptedMessage });
  } else {
    res.status(400).json({ message: 'Responde todas las preguntas correctamente para obtener el mensaje.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});