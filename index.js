const express = require('express');
const crypto = require('crypto');
const app = express();
const port = 3000;

app.use(express.json());

const users = {};

const questions = [
  { question: "How many bits are needed to represent the number 2024 in binary?", answer: 11 },
  { question: "A car accelerates uniformly from rest to 60 m/s in 10 seconds. What is the acceleration (in m/s²)?", answer: 6 },
  { question: "How many degrees is the angel between the hands of a clock at 3:00?", answer: 90 },
  { question: "In a Cartesian coordinate system, what is the distance between the points (3,4) and (0,0)?", answer: 5 }
];

function encryptMessage(seed) {
  const cipher = crypto.createCipher('aes-256-cbc', seed);
  let encrypted = cipher.update('🎉🎂 Happy Nerd Birthday!!! 🧠🔒✨', 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Generar un ID único para el usuario (en este caso usaremos un timestamp como ID)
function generateUserId() {
  return Date.now().toString(36);
}

// Verificar respuestas y actualizar el estado del usuario
function validateAnswer(userId, key, answer) {
  const user = users[userId];
  const questionIndex = parseInt(key.replace('key', '')) - 1;
  const correctAnswer = questions[questionIndex].answer;

  if (!isNaN(answer)) {
    if (parseInt(answer) === correctAnswer) {
      user[key] = { status: 'pass', value: answer };
    } else {
      user[key] = { status: 'fail', value: '' };
    }
  } else {
    if (answer.trim().toLowerCase() === correctAnswer) {
      user[key] = { status: 'pass', value: answer.trim().toLowerCase() };
    } else {
      user[key] = { status: 'fail', value: '' };
    }
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

app.get('/', getUser, (req, res) => {
  const message = `
    Trivia... <br><br>
    Use GET /key1; /key2; /key3; /key4; for questions.<br><br>
    Use POST /key1<br>
    Content-Type: application/json<br>
    {<br>
      "key1": "Value of the answer"<br>
    }<br><br>
    and take note of the responses.<br><br>
    When you unlock all the 4 keys, you can decrypt it:<br>
    POST /decrypt
    {<br>
      "key1": "Value of the answer",<br>
      "key2": "Value of the answer",<br>
      "key3": "Value of the answer",<br>
      "key4": "Value of the answer"<br>
   }<br><br>
  `;
  res.send(message);
});

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

app.post('/key1', getUser, (req, res) => {
  const { key1 } = req.body;
  validateAnswer(req.userId, 'key1', key1);
  const user = users[req.userId];
  res.json({ status: user.key1.status === 'pass' ? 'Success! you can now use key1: A1 ' : 'Wrong Answer!' });
});

app.post('/key2', getUser, (req, res) => {
  const { key2 } = req.body;
  validateAnswer(req.userId, 'key2', key2);
  const user = users[req.userId];
  res.json({ status: user.key2.status === 'pass' ? 'Success! you can now use key2: JJ' : 'Wrong Answer!' });
});

app.post('/key3', getUser, (req, res) => {
  const { key3 } = req.body;
  validateAnswer(req.userId, 'key3', key3);
  const user = users[req.userId];
  res.json({ status: user.key3.status === 'pass' ? 'Success! you can now use key3: 9w' : 'Wrong Answer!' });
});

app.post('/key4', getUser, (req, res) => {
  const { key4 } = req.body;
  validateAnswer(req.userId, 'key4', key4);
  const user = users[req.userId];
  res.json({ status: user.key4.status === 'pass' ? 'Success! you can now use key4: 01' : 'Wrong Answer!' });
});


app.post('/decript', getUser, (req, res) => {
  const user = users[req.userId];
  const { key1, key2, key3, key4 } = req.body;

  if (user.readyForDecript) {
    if (key1 === "A1" && key2 === "JJ" && key3 === "9w" && key4 === "01") {
      const seed = key1 + key2 + key3 + key4;
      const decryptedMessage = encryptMessage(seed);
      res.json({ message: '🎉🎂 Happy Nerdthday!!! 🧠🔒✨', encryptedMessage: decryptedMessage });
    } else {
      res.status(400).json({ message: 'The provided keys are incorrect.' });
    }
  } else {
    res.status(400).json({ message: 'First unlock all 4 keys.' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});