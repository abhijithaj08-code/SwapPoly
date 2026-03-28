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

function createListingCard(listing) {
  const card = document.createElement('article');
  card.className = 'listing-card';
  card.dataset.id = listing.id ?? '';
  card.tabIndex = 0;

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

export function renderLoading(statusElement, containerElement) {
  statusElement.textContent = 'Loading...';
  statusElement.classList.remove('is-error');
  containerElement.textContent = '';
}

export function renderError(statusElement, message) {
  statusElement.textContent = message;
  statusElement.classList.add('is-error');
}

export function renderListings(statusElement, containerElement, listings) {
  containerElement.textContent = '';

  if (!Array.isArray(listings) || listings.length === 0) {
    statusElement.textContent = 'No listings available';
    statusElement.classList.remove('is-error');
    return;
  }

  statusElement.textContent = '';
  statusElement.classList.remove('is-error');

  const fragment = document.createDocumentFragment();
  listings.forEach((listing) => {
    fragment.appendChild(createListingCard(listing));
  });

  containerElement.appendChild(fragment);
  console.log('Listings rendered');
}
