const express = require('express');
const bcrypt = require('bcrypt');
const Student = require('../models/student');
const Mentor = require('../models/mentor');
const College = require('../models/college');

const router = express.Router();

// Login route for Student
router.post('/student', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Student.findOne({ email });
    if (!user) return res.status(400).send("Student not found");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send("Incorrect password");

    res.send("Student logged in successfully");
  } catch (err) {
    res.status(500).send("Server error");
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  let user = await Student.findOne({ email }) || await Mentor.findOne({ email });

  if (!user) return res.render('login', { error: 'Invalid email or password' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.render('login', { error: 'Invalid email or password' });

  // Set session
  req.session.user = email;
  req.session.role = user instanceof Student ? 'Student' : 'Mentor';

  res.redirect('/dashboard');
});
// Similar routes can be created for Mentor and College

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;