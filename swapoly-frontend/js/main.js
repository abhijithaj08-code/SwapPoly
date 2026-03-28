import { getListings } from './api.js';
import { renderError, renderListings, renderLoading } from './ui.js';

async function init() {
  const statusMessage = document.getElementById('status-message');
  const listingsContainer = document.getElementById('listings-container');

  renderLoading(statusMessage, listingsContainer);

  const { listings, usingMockData, error } = await getListings();

  renderListings(statusMessage, listingsContainer, listings);

  if (usingMockData && error) {
    renderError(statusMessage, 'Could not reach backend. Showing sample data.');
  }
}

document.addEventListener('DOMContentLoaded', init);
