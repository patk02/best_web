const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
const dbURI = 'mongodb+srv://patk:Pk0984479298@cluster.x1rbldn.mongodb.net/best_web'

require('dotenv').config();
const secretKey = process.env.JWT_SECRET; // เปลี่ยนเป็น key ลับของคุณ

// เชื่อมต่อ MongoDB
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB error:', err));

// สร้าง Schema และ Model
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String
});

const User = mongoose.model('User', userSchema);

// สมัครสมาชิก
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  const existingUser = await User.findOne({ username });
  if (existingUser) return res.status(400).send('User already exists');

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashedPassword });

  await newUser.save();
  res.send('User registered successfully');
});

// ล็อกอิน
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(401).send('User not found');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).send('Invalid password');

  const token = jwt.sign({ id: user._id, username: user.username }, secretKey, { expiresIn: '1h' });
  res.json({ message: 'Login successful', token });
});

// route ป้องกันด้วย token
app.get('/protected', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send('No token provided');

  const token = authHeader.split(' ')[1];
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) return res.status(403).send('Invalid token');
    res.send(`Hello ${decoded.username}, you accessed protected data`);
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
