app.get('/profile', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const Student = require('./models/student'); // same for Mentor later
  const user = await Student.findOne({ email: req.session.user });

  if (!user) return res.redirect('/login');

  res.render('profile', { user });
});