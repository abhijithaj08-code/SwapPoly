import { getCurrentUser } from './user.js';

const USER_STORAGE_KEY = 'user';
const USER_REGISTRY_KEY = 'swapoly_users';

function getUi() {
  return {
    nameInput: document.getElementById('login-name'),
    continueButton: document.getElementById('continue-btn'),
    statusElement: document.getElementById('login-status'),
  };
}

function setStatus(statusElement, message, isError = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle('is-error', isError);
}

document.addEventListener('DOMContentLoaded', () => {
  const existingUser = getCurrentUser();

  if (existingUser) {
    console.log('Current user:', existingUser);
    window.location.href = './index.html';
    return;
  }

  const ui = getUi();

  if (!ui.nameInput || !ui.continueButton || !ui.statusElement) {
    console.error('Login page elements are missing.');
    return;
  }

  ui.continueButton.addEventListener('click', () => {
    const name = ui.nameInput.value.trim();

    if (!name) {
      setStatus(ui.statusElement, 'Enter your name', true);
      return;
    }

    const storedUsers = JSON.parse(localStorage.getItem(USER_REGISTRY_KEY) || '[]');
    const matchedUser = storedUsers.find(
      (user) => user.name.toLowerCase() === name.toLowerCase(),
    );

    const user =
      matchedUser ||
      {
        id: Date.now(),
        name,
      };

    if (!matchedUser) {
      storedUsers.push(user);
      localStorage.setItem(USER_REGISTRY_KEY, JSON.stringify(storedUsers));
    }

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    console.log('Current user:', user);
    window.location.href = './index.html';
  });
});
