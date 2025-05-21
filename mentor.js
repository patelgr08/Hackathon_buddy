const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  mobile: String,
  password: String,
  expertise: String, // primary domain of mentoring (e.g., AI, WebDev)
  experience: String, // e.g., "3 years", "Senior Developer at XYZ"
  techStack: String,
  city: String,
  state: String,
  github: String,
  linkedin: String,
  portfolio: String
});

module.exports = mongoose.model('Mentor', mentorSchema);