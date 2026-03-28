const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(
  cors({
    origin: 'http://127.0.0.1:5500',
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type'],
  }),
);

app.use(express.json({ limit: '10mb' }));

let listings = [];

app.get('/api/listings', (req, res) => {
  console.log('Returning listings:', listings.length);
  res.json(listings);
});

app.post('/api/listings', (req, res) => {
  console.log('Incoming request:', req.body);

  const { title, price, image_url, category_name } = req.body ?? {};

  if (!title || !price || !image_url || !category_name) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice) || numericPrice <= 0) {
    return res.status(400).json({ message: 'Price must be a positive number' });
  }

  const newListing = {
    id: Date.now(),
    title,
    price: numericPrice,
    image_url,
    category_name,
    status: 'Available',
  };

  listings.push(newListing);
  res.status(201).json(newListing);
});

app.patch('/api/listings/:id/sold', (req, res) => {
  const listingId = Number(req.params.id);
  const listing = listings.find((item) => item.id === listingId);

  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' });
  }

  listing.status = 'Sold';
  res.json(listing);
});

app.listen(PORT, () => {
  console.log('Server running on http://localhost:5000');
});
