const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const Student = require('./models/student');
const Mentor = require('./models/mentor');
const College = require('./models/college');

const app = express();

// ===== MONGODB CONNECTION =====
mongoose.connect('mongodb://localhost:27017/hackathonBuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ===== MIDDLEWARE =====
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(session({
  secret: 'your_secret_key', // Change this to something secure in production
  resave: false,
  saveUninitialized: false
}));

// ===== NODEMAILER SETUP =====
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your_email@gmail.com',
    pass: 'your_email_password' // Use app password if 2FA enabled
  }
});

// ===== COLLEGE OTP + REGISTRATION =====
app.post('/send-college-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success: false, message: 'Email required' });

  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

  try {
    await transporter.sendMail({
      from: '"Hackathon Buddy" <your_email@gmail.com>',
      to: email,
      subject: 'Your College Registration OTP',
      text: `Your OTP for college registration is: ${otp}`
    });

    let college = await College.findOne({ collegeEmail: email });
    if (!college) {
      college = new College({ collegeEmail: email });
    }
    college.otp = otp;
    college.otpExpires = otpExpires;
    await college.save();

    res.json({ success: true });
  } catch (error) {
    console.error('OTP send error:', error);
    res.json({ success: false });
  }
});

app.post('/register/college', async (req, res) => {
  const {
    collegeName,
    collegeCode,
    collegeEmail,
    password,
    confirmPassword,
    otp,
    addressCity,
    addressState,
    pincode,
    contactPerson,
    contactEmail,
    collegeType
  } = req.body;

  if (!collegeName || !collegeCode || !collegeEmail || !password || !confirmPassword || !otp || !addressCity || !addressState || !pincode || !contactPerson || !contactEmail || !collegeType) {
    return res.status(400).send('All fields are required.');
  }

  if (password !== confirmPassword) {
    return res.status(400).send('Passwords do not match.');
  }

  const college = await College.findOne({ collegeEmail });
  if (!college) return res.status(400).send('No OTP request found.');

  if (college.otp !== otp) return res.status(400).send('Invalid OTP.');
  if (college.otpExpires < new Date()) return res.status(400).send('OTP expired.');

  college.collegeName = collegeName;
  college.collegeCode = collegeCode;
  college.password = password; // 🔐 You should hash this in production
  college.addressCity = addressCity;
  college.addressState = addressState;
  college.pincode = pincode;
  college.contactPerson = contactPerson;
  college.contactEmail = contactEmail;
  college.collegeType = collegeType;
  college.otp = undefined;
  college.otpExpires = undefined;

  await college.save();

  res.send('College registered successfully!');
});

// ===== DASHBOARD =====
app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('dashboard', { email: req.session.user });
});

// ===== PROFILE PAGE =====
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

// ===== EXPLORE PAGE =====
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

// ===== LOGIN POST ROUTE (Example) =====
// You can place this in login.js instead if using modular routes
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  let user = await Student.findOne({ email });

  if (!user) user = await Mentor.findOne({ email });
  if (!user) return res.send("User not found");

  // You should verify hashed password in production
  if (user.password !== password) return res.send("Invalid credentials");

  req.session.user = email; // ✅ Save session
  res.redirect('/dashboard');
});

// ===== SERVER START =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});