// Step 2: Admin Login and Listing Web Page (CRUD Operations in ExpressJS)
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const SECRET_KEY = 'your_secret_key';
app.use(bodyParser.json());

// Mock Database (replace with real DB queries)
const users = [
  { id: 1, name: 'Admin', email: 'admin@example.com', password: bcrypt.hashSync('admin123', 10), role_type: 'a' },
];
const listings = [
  { id: 1, user_id: 1, name: 'Starbucks Mid Valley', latitude: 3.12345, longitude: 101.67890 },
];

// Admin Login
app.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.role_type === 'a');
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ user_id: user.id, role_type: user.role_type }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ status: 200, message: 'Logged in', result: { access_token: token } });
  }
  res.status(401).json({ status: 401, message: 'Unauthorized' });
});

// CRUD Routes for Listings (Admin Only)
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.role_type !== 'a') throw new Error();
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ status: 403, message: 'Forbidden' });
  }
};

app.get('/admin/listings', authenticateAdmin, (req, res) => {
  res.json({ status: 200, message: 'Success', result: listings });
});

app.post('/admin/listings', authenticateAdmin, (req, res) => {
  const { name, latitude, longitude } = req.body;
  const id = listings.length + 1;
  listings.push({ id, user_id: req.user.user_id, name, latitude, longitude });
  res.json({ status: 200, message: 'Listing added', result: { id } });
});

app.put('/admin/listings/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { name, latitude, longitude } = req.body;
  const listing = listings.find(l => l.id == id);
  if (listing) {
    listing.name = name;
    listing.latitude = latitude;
    listing.longitude = longitude;
    res.json({ status: 200, message: 'Listing updated' });
  } else {
    res.status(404).json({ status: 404, message: 'Listing not found' });
  }
});

app.delete('/admin/listings/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const index = listings.findIndex(l => l.id == id);
  if (index !== -1) {
    listings.splice(index, 1);
    res.json({ status: 200, message: 'Listing deleted' });
  } else {
    res.status(404).json({ status: 404, message: 'Listing not found' });
  }
});

// Step 3: User Login and Get Listing API (RESTful API)
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ user_id: user.id, role_type: user.role_type }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({
      status: 200,
      message: 'Logged in',
      result: { user_id: user.id, access_token: token, role_type: user.role_type, expires_at: new Date(Date.now() + 3600 * 1000) },
    });
  }
  res.status(401).json({ status: 401, message: 'Unauthorized' });
});

app.get('/listing/get', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const result = listings
      .filter(l => l.user_id === decoded.user_id)
      .map(l => ({
        id: l.id,
        name: l.name,
        distance: Math.random().toFixed(2), // Placeholder for distance calculation
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    res.json({ status: 200, message: 'Success', result: { current_page: 1, data: result } });
  } catch {
    res.status(401).json({ status: 401, message: 'Unauthorized' });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
