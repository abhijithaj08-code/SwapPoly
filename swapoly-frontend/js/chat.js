import { createMessage, getMessages } from './api.js';
import { renderError, renderLoading } from './ui.js';

let refreshHandle = null;

function getUi() {
  return {
    statusElement: document.getElementById('chat-status'),
    messagesList: document.getElementById('messages-list'),
    form: document.getElementById('chat-form'),
    input: document.getElementById('message-input'),
    sendButton: document.getElementById('send-btn'),
    container: document.getElementById('chat-container'),
  };
}

function formatTime(value) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

function renderMessages(messagesList, messages) {
  messagesList.textContent = '';

  if (!Array.isArray(messages) || messages.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'status-message';
    emptyState.textContent = 'No messages yet.';
    messagesList.appendChild(emptyState);
    return;
  }

  const fragment = document.createDocumentFragment();

  messages.forEach((item) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-message';

    const sender = document.createElement('strong');
    sender.textContent = item.sender;

    const body = document.createElement('p');
    body.textContent = item.message;

    const time = document.createElement('span');
    time.className = 'chat-meta';
    time.textContent = formatTime(item.created_at);

    wrapper.append(sender, body, time);
    fragment.appendChild(wrapper);
  });

  messagesList.appendChild(fragment);
}

async function loadMessages(listingId, ui) {
  try {
    const messages = await getMessages(listingId);
    ui.statusElement.textContent = '';
    ui.statusElement.classList.remove('is-error');
    renderMessages(ui.messagesList, messages);
  } catch (error) {
    renderError(ui.statusElement, 'Unable to load messages. Please try again later.');
    console.error('Failed to load messages:', error);
  }
}

async function handleSubmit(event, listingId, ui) {
  event.preventDefault();

  const message = ui.input.value.trim();

  if (!message) {
    return;
  }

  ui.sendButton.disabled = true;
  ui.sendButton.textContent = 'Sending...';

  try {
    await createMessage({
      listing_id: listingId,
      sender: 'user1',
      message,
    });

    ui.input.value = '';
    await loadMessages(listingId, ui);
  } catch (error) {
    renderError(ui.statusElement, 'Unable to send message. Please try again later.');
    console.error('Failed to send message:', error);
  } finally {
    ui.sendButton.disabled = false;
    ui.sendButton.textContent = 'Send';
  }
}

function startAutoRefresh(listingId, ui) {
  refreshHandle = window.setInterval(() => {
    loadMessages(listingId, ui);
  }, 2500);
}

function stopAutoRefresh() {
  if (refreshHandle) {
    window.clearInterval(refreshHandle);
    refreshHandle = null;
  }
}

async function initChatPage() {
  const ui = getUi();

  if (!ui.statusElement || !ui.messagesList || !ui.form || !ui.input || !ui.sendButton || !ui.container) {
    console.error('Required chat elements are missing.');
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const listingId = params.get('listing_id');

  if (!listingId) {
    renderError(ui.statusElement, 'Listing not found for chat.');
    return;
  }

  renderLoading(ui.statusElement, ui.messagesList);
  await loadMessages(listingId, ui);

  ui.form.addEventListener('submit', (event) => {
    handleSubmit(event, listingId, ui);
  });

  startAutoRefresh(listingId, ui);
  window.addEventListener('beforeunload', stopAutoRefresh, { once: true });
}

document.addEventListener('DOMContentLoaded', () => {
  initChatPage();
});
