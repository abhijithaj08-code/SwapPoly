import { getListings } from './api.js';
import { renderError, renderListings, renderLoading } from './ui.js';

console.log('JS Loaded');

function attachEventListeners() {
  const listingsContainer = document.getElementById('listings-container');
  const addItemButton = document.getElementById('add-item-btn');

  if (listingsContainer) {
    listingsContainer.addEventListener('click', (event) => {
      const card = event.target.closest('.listing-card');

      if (!card || !listingsContainer.contains(card)) {
        return;
      }

      console.log('Clicked listing:', card.dataset.id);
    });
  }

  if (addItemButton) {
    addItemButton.addEventListener('click', () => {
      console.log('Add item clicked');
    });
  }

  console.log('Event listeners attached');
}

async function initApp() {
  const statusMessage = document.getElementById('status-message');
  const listingsContainer = document.getElementById('listings-container');

  if (!statusMessage || !listingsContainer) {
    console.error('Required UI elements are missing.');
    return;
  }

  renderLoading(statusMessage, listingsContainer);
  attachEventListeners();

  try {
    const { listings, usingMockData, error } = await getListings();

    renderListings(statusMessage, listingsContainer, listings);

    if (usingMockData && error) {
      renderError(statusMessage, 'Could not reach backend. Showing sample data.');
      console.error('Failed to fetch listings:', error);
    }
  } catch (error) {
    renderError(statusMessage, 'Something went wrong while loading listings.');
    console.error('App initialization failed:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});
