const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/profile', auth, (req, res) => {
    res.json({ message: 'Welcome to your profile!', user: req.user });
});

module.exports = router;
