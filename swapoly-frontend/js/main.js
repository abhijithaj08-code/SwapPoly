import { getListings, markAsSold } from './api.js';
import {
  attachEventHandlers,
  renderError,
  renderListings,
  renderLoading,
  updateListingStatus,
} from './ui.js';
import { getCurrentUser, logoutCurrentUser, requireCurrentUser } from './user.js';

console.log('JS Loaded');

function getUi() {
  return {
    statusMessage: document.getElementById('status-message'),
    listingsContainer: document.getElementById('listings-container'),
    addItemButton: document.getElementById('add-item-btn'),
    welcomeUser: document.getElementById('welcome-user'),
    logoutButton: document.getElementById('logout-btn'),
  };
}

function setupHeader(ui, currentUser) {
  if (ui.welcomeUser) {
    ui.welcomeUser.textContent = `Welcome, ${currentUser.name}`;
  }

  ui.logoutButton?.addEventListener('click', () => {
    logoutCurrentUser();
  });
}

function attachUiHandlers(ui) {
  attachEventHandlers(ui.listingsContainer, ui.addItemButton, {
    onCardClick(listingId) {
      console.log('Clicked listing:', listingId);
      window.location.href = `./item.html?id=${listingId}`;
    },
    onChat(listing) {
      console.log('Start chat for listing:', listing.id);
      const currentUser = getCurrentUser();
      const buyerId = String(currentUser?.id) === String(listing.sellerId) ? '' : String(currentUser?.id ?? '');
      const params = new URLSearchParams({
        listing_id: String(listing.id),
        title: listing.title || '',
        whatsapp: listing.whatsapp || '',
        seller_id: listing.sellerId || '',
        buyer_id: buyerId,
      });
      window.location.href = `./chat.html?${params.toString()}`;
    },
    async onMarkSold(listingId, buttonElement) {
      const originalLabel = buttonElement.textContent;

      try {
        buttonElement.disabled = true;
        buttonElement.textContent = 'Updating...';
        await markAsSold(listingId);
        updateListingStatus(ui.listingsContainer, listingId);
      } catch (error) {
        buttonElement.disabled = false;
        buttonElement.textContent = originalLabel;
        renderError(ui.statusMessage, 'Unable to update listing status. Please try again later.');
        console.error('Failed to mark listing as sold:', error);
      }
    },
    onAddItem() {
      console.log('Navigate to Add Listing Page');
      window.location.href = './add-listing.html';
    },
  });
}

async function initApp() {
  const currentUser = requireCurrentUser();

  if (!currentUser) {
    return;
  }

  const ui = getUi();

  if (!ui.statusMessage || !ui.listingsContainer) {
    console.error('Required UI elements are missing.');
    return;
  }

  setupHeader(ui, currentUser);
  renderLoading(ui.statusMessage, ui.listingsContainer);
  attachUiHandlers(ui);

  try {
    const listings = await getListings();
    renderListings(ui.statusMessage, ui.listingsContainer, listings);
  } catch (error) {
    renderError(ui.statusMessage, 'Unable to load listings. Please try again later.');
    console.error('App initialization failed:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});
