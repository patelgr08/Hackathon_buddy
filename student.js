const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();

// ===== MIDDLEWARE =====
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(session({ secret: 'secret-key', resave: false, saveUninitialized: false }));

// ===== MONGODB CONNECTION =====
mongoose.connect('mongodb://127.0.0.1:27017/hackathonBuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected')).catch(err => console.log(err));

// ===== MODELS =====
const Student = require('./models/student');
const Mentor = require('./models/mentor');
const College = require('./models/college');

// ===== NODEMAILER SETUP =====
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your_email@gmail.com',
    pass: 'your_email_password'
  }
});

// ===== ROUTES =====

// Registration Page for Student
app.get('/register/student', (req, res) => {
  res.render('student-registration');
});

// Register Student POST
app.post('/register/student', async (req, res) => {
  const { fullName, email, password, college, branch, year, techStack, role, city, state, github, linkedin, portfolio } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newStudent = new Student({ fullName, email, password: hashedPassword, college, branch, year, techStack, role, city, state, github, linkedin, portfolio });
    await newStudent.save();
    res.redirect('/login');
  } catch (error) {
    console.error('Student registration error:', error);
    res.send('Error registering student');
  }
});

// Login Page
app.get('/login', (req, res) => {
  res.render('login');
});

// Login POST
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const student = await Student.findOne({ email });
    if (student && await bcrypt.compare(password, student.password)) {
      req.session.user = email;
      return res.redirect('/dashboard');
    }
    const mentor = await Mentor.findOne({ email });
    if (mentor && await bcrypt.compare(password, mentor.password)) {
      req.session.user = email;
      return res.redirect('/dashboard');
    }
    res.send('Invalid credentials');
  } catch (error) {
    console.error('Login error:', error);
    res.send('Login failed');
  }
});

// Dashboard Page
app.get('/dashboard', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const student = await Student.findOne({ email: req.session.user });
    if (student) return res.render('dashboard', { user: student });
    const mentor = await Mentor.findOne({ email: req.session.user });
    if (mentor) return res.render('dashboard', { user: mentor });
    res.redirect('/login');
  } catch (error) {
    console.error('Dashboard error:', error);
    res.send('Error loading dashboard');
  }
});

// Profile Page
app.get('/profile', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const student = await Student.findOne({ email: req.session.user });
    const mentor = await Mentor.findOne({ email: req.session.user });
    if (student) return res.render('profile', { user: student, role: 'Student' });
    if (mentor) return res.render('profile', { user: mentor, role: 'Mentor' });
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.send("Error loading profile");
  }
});

// Explore Page
app.get('/explore', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const allStudents = await Student.find({ email: { $ne: req.session.user } });
    const allMentors = await Mentor.find({ email: { $ne: req.session.user } });
    res.render('explore', { students: allStudents, mentors: allMentors });
  } catch (err) {
    console.error(err);
    res.send("Error loading explore");
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Server
app.listen(3000, () => console.log('Server started on port 3000'));
