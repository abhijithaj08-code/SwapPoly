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
let messages = [];

app.get('/api/listings', (req, res) => {
  console.log('Returning listings:', listings.length);
  res.json(listings);
});

app.post('/api/listings', (req, res) => {
  console.log('Incoming request:', req.body);

  const { title, price, image_url, category_name, seller_id, whatsapp_number } = req.body ?? {};

  if (!title || !price || !image_url || !category_name || !whatsapp_number) {
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
    whatsapp_number,
    seller_id: seller_id ?? null,
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

app.post('/api/messages', (req, res) => {
  const { listing_id, sender_id, sender, sender_role, message } = req.body ?? {};

  if (!listing_id || !sender || !message) {
    return res.status(400).json({ message: 'listing_id, sender, and message are required' });
  }

  const newMessage = {
    id: Date.now(),
    listing_id,
    sender_id: sender_id ?? null,
    sender,
    sender_role: sender_role ?? 'buyer',
    message,
    created_at: new Date(),
  };

  messages.push(newMessage);
  res.status(201).json(newMessage);
});

app.get('/api/messages/:listing_id', (req, res) => {
  const listingMessages = messages.filter(
    (msg) => String(msg.listing_id) === String(req.params.listing_id),
  );

  res.json(listingMessages);
});

app.listen(PORT, () => {
  console.log('Server running on http://localhost:5000');
});
