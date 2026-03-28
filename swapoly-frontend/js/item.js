import { getListings, markAsSold } from './api.js';
import { formatPrice, renderError, renderLoading } from './ui.js';

function getUi() {
  return {
    statusElement: document.getElementById('item-status'),
    containerElement: document.getElementById('item-container'),
  };
}

function isSold(listing) {
  return String(listing?.status).toLowerCase() === 'sold';
}

function createActionButton(label, className, action, disabled = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.dataset.action = action;
  button.textContent = label;
  button.disabled = disabled;
  return button;
}

function renderItem(containerElement, listing) {
  containerElement.textContent = '';

  const card = document.createElement('article');
  card.className = 'listing-card';
  card.dataset.id = listing.id ?? '';

  const imageWrap = document.createElement('div');
  imageWrap.className = 'image-wrap';

  const image = document.createElement('img');
  image.className = 'listing-image';
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

  const status = document.createElement('p');
  status.className = 'status-message';
  status.textContent = `Status: ${listing.status || 'Unknown'}`;

  const actions = document.createElement('div');
  actions.className = 'listing-actions';

  const sold = isSold(listing);
  const chatButton = createActionButton('Chat / Make Offer', 'chat-btn', 'chat', sold);
  const soldButton = createActionButton(sold ? 'Sold' : 'Mark as Sold', 'sold-btn', 'sold', sold);

  actions.append(chatButton, soldButton);
  content.append(title, price, category, status, actions);
  card.append(imageWrap, content);
  containerElement.appendChild(card);
}

function updateItemStatus(containerElement, listingId) {
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

  const status = card.querySelector('.status-message');
  const chatButton = card.querySelector('.chat-btn');
  const soldButton = card.querySelector('.sold-btn');

  if (status) {
    status.textContent = 'Status: Sold';
  }

  if (chatButton) {
    chatButton.disabled = true;
  }

  if (soldButton) {
    soldButton.disabled = true;
    soldButton.textContent = 'Sold';
  }
}

function attachItemHandlers(containerElement, statusElement) {
  containerElement.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    const card = event.target.closest('.listing-card');

    if (!button || !card) {
      return;
    }

    const listingId = card.dataset.id;

    if (button.dataset.action === 'chat') {
      console.log('Start chat for listing:', listingId);
      window.location.href = `./chat.html?listing_id=${listingId}`;
      return;
    }

    if (button.dataset.action === 'sold' && !button.disabled) {
      const originalText = button.textContent;

      try {
        button.disabled = true;
        button.textContent = 'Updating...';
        await markAsSold(listingId);
        updateItemStatus(containerElement, listingId);
      } catch (error) {
        button.disabled = false;
        button.textContent = originalText;
        renderError(statusElement, 'Unable to update listing status. Please try again later.');
        console.error('Failed to mark listing as sold:', error);
      }
    }
  });
}

async function initItemPage() {
  const ui = getUi();

  if (!ui.statusElement || !ui.containerElement) {
    console.error('Required item detail elements are missing.');
    return;
  }

  renderLoading(ui.statusElement, ui.containerElement);
  attachItemHandlers(ui.containerElement, ui.statusElement);

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    renderError(ui.statusElement, 'Item not found');
    return;
  }

  try {
    const listings = await getListings();
    const listing = listings.find((item) => String(item.id) === String(id));

    if (!listing) {
      renderError(ui.statusElement, 'Item not found');
      ui.containerElement.textContent = '';
      return;
    }

    ui.statusElement.textContent = '';
    ui.statusElement.classList.remove('is-error');
    renderItem(ui.containerElement, listing);
  } catch (error) {
    renderError(ui.statusElement, 'Unable to load item details. Please try again later.');
    console.error('Failed to load item details:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initItemPage();
});
