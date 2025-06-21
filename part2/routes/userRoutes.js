const express = require('express');
const router = express.Router();
const db = require('../models/db'); 

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, email, role FROM Users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get users' });
  }
});

router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `, [username, email, password, role]);

    res.status(201).json({ message: 'User registered', user_id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(req.session.user);
});


router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query(`
    SELECT user_id, username, role FROM Users
    WHERE username = ? AND password_hash = ?
    
    `, [username, password]);

    if (rows.length === 0) {
      return res.status(401).send('Invalid credentials');
    }

    const user = rows[0];

 
    req.session.user = {
      id: user.user_id,
      username: user.username,
      role: user.role
    };

    if (user.role === 'owner') {
      return res.redirect('/owner-dashboard.html');
    } else if (user.role === 'walker') {
      return res.redirect('/walker-dashboard.html');
    } else {
      return res.status(400).send('Unknown role');
    }

  } catch (error) {
    res.status(500).send('Login failed');
  }

});

router.post('/logout', (req, res) => {
  req.session.destroy(errors => {
    if (errors) {
      return res.status(500).send('Cannot logout');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

module.exports = router;
