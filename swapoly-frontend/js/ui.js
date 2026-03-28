import { getCurrentUser } from './user.js';

export function formatPrice(price) {
  if (price === null || price === undefined || Number.isNaN(Number(price))) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(0);
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(price));
}

function isSold(listing) {
  return String(listing.status).toLowerCase() === 'sold';
}

function createListingCard(listing) {
  const currentUser = getCurrentUser();
  const card = document.createElement('article');
  card.className = 'listing-card';
  card.dataset.id = listing.id ?? '';
  card.dataset.title = listing.title ?? '';
  card.dataset.whatsapp = listing.whatsapp_number ?? '';
  card.dataset.sellerId = listing.seller_id ?? '';
  card.dataset.sellerName = listing.seller_name ?? '';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');

  const imageWrap = document.createElement('div');
  imageWrap.className = 'image-wrap';

  const image = document.createElement('img');
  image.className = 'listing-image';
  image.loading = 'lazy';
  image.src = listing.image_url || 'https://via.placeholder.com/600x450?text=No+Image';
  image.alt = listing.title || 'Listing image';

  imageWrap.appendChild(image);

  if (isSold(listing)) {
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

  const owner = document.createElement('p');
  owner.className = 'status-message listing-owner';
  owner.textContent = `Listed by: ${listing.seller_name || 'Unknown seller'}`;

  const actions = document.createElement('div');
  actions.className = 'listing-actions';

  const chatButton = document.createElement('button');
  chatButton.type = 'button';
  chatButton.className = 'chat-btn';
  chatButton.dataset.action = 'chat';
  chatButton.textContent = 'Chat / Make Offer';

  const soldButton = document.createElement('button');
  soldButton.type = 'button';
  soldButton.className = 'sold-btn';
  soldButton.dataset.action = 'sold';
  soldButton.textContent = isSold(listing) ? 'Sold' : 'Mark as Sold';
  const isOwner = String(listing.seller_id) === String(currentUser.id);

  if (isSold(listing)) {
    chatButton.disabled = true;
    soldButton.disabled = true;
  }

  actions.append(chatButton);

  if (isOwner) {
    actions.append(soldButton);
  }

  content.append(title, price, category, owner, actions);
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

export function updateListingStatus(containerElement, listingId) {
  const card = containerElement.querySelector(`.listing-card[data-id="${listingId}"]`);

  if (!card) {
    return;
  }

  if (!card.querySelector('.sold-overlay')) {
    const imageWrap = card.querySelector('.image-wrap');
    const soldOverlay = document.createElement('div');
    soldOverlay.className = 'sold-overlay';
    soldOverlay.textContent = 'SOLD';
    imageWrap?.appendChild(soldOverlay);
  }

  const chatButton = card.querySelector('.chat-btn');
  const soldButton = card.querySelector('.sold-btn');

  if (chatButton) {
    chatButton.disabled = true;
  }

  if (soldButton) {
    soldButton.disabled = true;
    soldButton.textContent = 'Sold';
  }
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

export function attachEventHandlers(containerElement, addItemButton, handlers) {
  containerElement.addEventListener('click', (event) => {
    const actionButton = event.target.closest('button[data-action]');

    if (actionButton) {
      event.preventDefault();
      event.stopPropagation();
      const card = actionButton.closest('.listing-card');

      if (!card) {
        return;
      }

      if (actionButton.dataset.action === 'chat') {
        handlers.onChat({
          id: card.dataset.id,
          title: card.dataset.title,
          whatsapp: card.dataset.whatsapp,
          sellerId: card.dataset.sellerId,
          sellerName: card.dataset.sellerName,
        });
      }

      if (actionButton.dataset.action === 'sold' && !actionButton.disabled) {
        handlers.onMarkSold(card.dataset.id, actionButton);
      }

      return;
    }

    const card = event.target.closest('.listing-card');

    if (card && containerElement.contains(card)) {
      handlers.onCardClick(card.dataset.id);
    }
  });

  containerElement.addEventListener('keydown', (event) => {
    const card = event.target.closest('.listing-card');

    if (!card || !containerElement.contains(card)) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handlers.onCardClick(card.dataset.id);
    }
  });

  addItemButton?.addEventListener('click', handlers.onAddItem);
  console.log('Event listeners attached');
}
