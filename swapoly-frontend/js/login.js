import { getCurrentUser, setCurrentUser } from './user.js';

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

    setCurrentUser(name);
    window.location.href = './index.html';
  });
});
