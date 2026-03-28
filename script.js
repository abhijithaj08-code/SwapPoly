const API_URL = 'http://localhost:5000/api/listings';

document.addEventListener('DOMContentLoaded', () => {
  console.log('JS Loaded');
  initializePage();
});

function getUi() {
  return {
    statusMessage: document.getElementById('status-message'),
    listingsGrid: document.getElementById('listings-grid'),
    addItemButton: document.getElementById('add-item-btn'),
  };
}

async function initializePage() {
  const ui = getUi();

  if (!ui.statusMessage || !ui.listingsGrid) {
    console.error('Required UI elements are missing.');
    return;
  }

  attachEventListeners(ui);
  setStatus(ui, 'Loading...');
  clearListings(ui);

  try {
    const listings = await fetchListings();

    if (!Array.isArray(listings) || listings.length === 0) {
      setStatus(ui, 'No listings available');
      return;
    }

    renderListings(ui, listings);
    setStatus(ui, '');
  } catch (error) {
    console.error('Failed to fetch listings:', error);
    setStatus(ui, 'Unable to load listings. Please try again later.', true);
  }
}

function attachEventListeners(ui) {
  ui.listingsGrid.addEventListener('click', (event) => {
    const card = event.target.closest('.listing-card');

    if (!card || !ui.listingsGrid.contains(card)) {
      return;
    }

    console.log('Clicked listing:', card.dataset.id);
  });

  ui.listingsGrid.addEventListener('keydown', (event) => {
    const card = event.target.closest('.listing-card');

    if (!card || !ui.listingsGrid.contains(card)) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      console.log('Clicked listing:', card.dataset.id);
    }
  });

  if (ui.addItemButton) {
    ui.addItemButton.addEventListener('click', () => {
      console.log('Add item clicked');
    });
  }

  console.log('Event listeners attached');
}

async function fetchListings() {
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

function renderListings(ui, listings) {
  clearListings(ui);

  const fragment = document.createDocumentFragment();

  listings.forEach((listing) => {
    const card = createListingCard(listing);
    fragment.appendChild(card);
  });

  ui.listingsGrid.appendChild(fragment);
  console.log('Listings rendered');
}

function createListingCard(listing) {
  const card = document.createElement('article');
  card.className = 'listing-card';
  card.dataset.id = listing.id ?? '';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Open listing ${listing.title ?? 'details'}`);

  const imageWrap = document.createElement('div');
  imageWrap.className = 'image-wrap';

  const image = document.createElement('img');
  image.className = 'listing-image';
  image.loading = 'lazy';
  image.src = listing.image_url || 'https://via.placeholder.com/600x450?text=No+Image';
  image.alt = listing.title || 'Listing image';

  imageWrap.appendChild(image);

  if (String(listing.status).toLowerCase() === 'sold') {
    const soldOverlay = document.createElement('div');
    soldOverlay.className = 'sold-overlay';
    soldOverlay.textContent = 'SOLD';
    imageWrap.appendChild(soldOverlay);
  }

  const content = document.createElement('div');
  content.className = 'listing-content';

  const title = document.createElement('h2');
  title.className = 'listing-title';
  title.textContent = listing.title || 'Untitled listing';

  const price = document.createElement('p');
  price.className = 'listing-price';
  price.textContent = formatPrice(listing.price);

  const category = document.createElement('span');
  category.className = 'category-tag';
  category.textContent = listing.category_name || 'Uncategorized';

  content.append(title, price, category);
  card.append(imageWrap, content);

  return card;
}

function formatPrice(price) {
  if (price === null || price === undefined || Number.isNaN(Number(price))) {
    return '$0.00';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(price));
}

function setStatus(ui, message, isError = false) {
  ui.statusMessage.textContent = message;
  ui.statusMessage.classList.toggle('is-error', isError);
}

function clearListings(ui) {
  ui.listingsGrid.textContent = '';
}
