const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  collegeName: String,
  collegeCode: String, // Aishe Code
  collegeEmail: String,
  password: String,
  address: {
    city: String,
    state: String,
    pincode: String
  },
  contactPersonName: String,
  contactEmail: String,
  collegeType: String, // e.g., Govt, Private, Autonomous
  domainVerified: Boolean // Optional: true after OTP verification
});

module.exports = mongoose.model('College', collegeSchema);