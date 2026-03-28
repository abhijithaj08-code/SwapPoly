import { createListing } from './api.js';
import { getCurrentUser } from './user.js';

const CATEGORY_OPTIONS = new Set([
  'Drawing Gear',
  'Lab Essentials',
  'Books',
  'Electronics',
]);

function getUi() {
  return {
    form: document.getElementById('add-listing-form'),
    status: document.getElementById('form-status'),
    submitButton: document.getElementById('submit-btn'),
    titleInput: document.getElementById('title'),
    priceInput: document.getElementById('price'),
    imageUrlInput: document.getElementById('image_url'),
    categoryInput: document.getElementById('category'),
  };
}

function setStatus(statusElement, message, isError = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle('is-error', isError);
}

function validateForm({ title, price, image_url, category_name }) {
  if (!title || !price || !image_url || !category_name) {
    return 'All fields are required.';
  }

  if (Number.isNaN(price) || price <= 0) {
    return 'Price must be a positive number.';
  }

  if (!CATEGORY_OPTIONS.has(category_name)) {
    return 'Please select a valid category.';
  }

  return null;
}

async function handleSubmit(event, ui) {
  event.preventDefault();
  const currentUser = getCurrentUser();

  const payload = {
    title: ui.titleInput.value.trim(),
    price: Number(ui.priceInput.value),
    image_url: ui.imageUrlInput.value.trim(),
    category_name: ui.categoryInput.value.trim(),
    seller_id: currentUser.id,
  };

  const validationError = validateForm(payload);

  if (validationError) {
    setStatus(ui.status, validationError, true);
    return;
  }

  ui.submitButton.disabled = true;
  ui.submitButton.textContent = 'Posting...';
  setStatus(ui.status, '');

  try {
    await createListing(payload);
    setStatus(ui.status, 'Listing created successfully');
    window.location.href = './index.html';
  } catch (error) {
    setStatus(
      ui.status,
      error instanceof Error && error.message
        ? `Failed to create listing. ${error.message}`
        : 'Failed to create listing. Try again.',
      true,
    );
    console.error('Failed to create listing:', error);
  } finally {
    ui.submitButton.disabled = false;
    ui.submitButton.textContent = 'Create Listing';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  getCurrentUser();
  const ui = getUi();

  if (!ui.form || !ui.status || !ui.submitButton) {
    console.error('Add listing form elements are missing.');
    return;
  }

  ui.form.addEventListener('submit', (event) => {
    handleSubmit(event, ui);
  });
});
