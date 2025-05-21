const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

const Student = require('../models/student');
const Mentor = require('../models/mentor');
const College = require('../models/college');

// Student Registration
router.post('/student', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.send("Student registered successfully!");
  } catch (err) {
    res.status(500).send("Error registering student.");
  }
});

// Mentor Registration
router.post('/mentor', async (req, res) => {
  try {
    const mentor = new Mentor(req.body);
    await mentor.save();
    res.send("Mentor registered successfully!");
  } catch (err) {
    res.status(500).send("Error registering mentor.");
  }
});

// College Registration
router.post('/college', async (req, res) => {
  try {
    const college = new College(req.body);
    await college.save();
    res.send("College registered successfully!");
  } catch (err) {
    res.status(500).send("Error registering college.");
  }
});

const otpStore = {}; // Temporarily stores OTPs

// Send OTP to email
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[email] = otp;

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"Hackathon Buddy" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'OTP Verification',
    text: `Your OTP is: ${otp}`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to send OTP:', err);
    res.json({ success: false });
  }
});

// Export this route

module.exports = router;