const API_URL = 'http://localhost:5000/api/listings';

const ui = {
  statusMessage: document.getElementById('status-message'),
  listingsGrid: document.getElementById('listings-grid'),
};

document.addEventListener('DOMContentLoaded', () => {
  initializePage();
});

async function initializePage() {
  setStatus('Loading...');
  clearListings();

  try {
    const listings = await fetchListings();

    if (!Array.isArray(listings) || listings.length === 0) {
      setStatus('No listings available');
      return;
    }

    renderListings(listings);
    setStatus('');
  } catch (error) {
    console.error('Failed to fetch listings:', error);
    setStatus('Unable to load listings. Please try again later.', true);
  }
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

function renderListings(listings) {
  clearListings();

  const fragment = document.createDocumentFragment();

  listings.forEach((listing) => {
    const card = createListingCard(listing);
    fragment.appendChild(card);
  });

  ui.listingsGrid.appendChild(fragment);
}

function createListingCard(listing) {
  const card = document.createElement('article');
  card.className = 'listing-card';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Open listing ${listing.title ?? 'details'}`);

  card.addEventListener('click', () => {
    console.log('Listing clicked:', listing.id);
  });

  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      console.log('Listing clicked:', listing.id);
    }
  });

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

function setStatus(message, isError = false) {
  ui.statusMessage.textContent = message;
  ui.statusMessage.classList.toggle('is-error', isError);
}

function clearListings() {
  ui.listingsGrid.textContent = '';
}
