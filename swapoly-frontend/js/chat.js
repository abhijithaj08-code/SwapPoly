import { createMessage, getListings, getMessages } from './api.js';
import { renderError, renderLoading } from './ui.js';
import { getCurrentUser, requireCurrentUser } from './user.js';

let refreshHandle = null;

function getUi() {
  return {
    statusElement: document.getElementById('chat-status'),
    roleElement: document.getElementById('chat-role'),
    messagesList: document.getElementById('messages-list'),
    form: document.getElementById('chat-form'),
    input: document.getElementById('message-input'),
    sendButton: document.getElementById('send-btn'),
    container: document.getElementById('chat-container'),
    whatsappButton: document.getElementById('whatsapp-btn'),
  };
}

function setRoleLabel(roleElement, role) {
  if (!roleElement) {
    return;
  }

  roleElement.textContent = `You are chatting as ${role === 'seller' ? 'Seller' : 'Buyer'}`;
}

function openWhatsApp(listing) {
  if (!listing?.whatsapp_number) {
    alert('Seller WhatsApp number not available');
    return;
  }

  const message = `Hi, I saw your listing for ${listing.title || 'this item'} on SwapPoly. Is it still available?`;
  const encodedMessage = encodeURIComponent(message);
  const sanitizedNumber = String(listing.whatsapp_number).replace(/[^\d]/g, '');
  window.open(`https://wa.me/${sanitizedNumber}?text=${encodedMessage}`, '_blank');
}

function formatTime(value) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

function renderMessages(messagesList, messages, currentUser) {
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
    if (String(item.sender_id) === String(currentUser.id)) {
      wrapper.classList.add('is-own');
    }

    const sender = document.createElement('strong');
    sender.textContent = item.sender_role
      ? `${item.sender} (${item.sender_role})`
      : item.sender;

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

async function loadMessages(listingId, ui, currentUser) {
  try {
    const messages = await getMessages(listingId);
    ui.statusElement.textContent = '';
    ui.statusElement.classList.remove('is-error');
    renderMessages(ui.messagesList, messages, currentUser);
  } catch (error) {
    renderError(ui.statusElement, 'Unable to load messages. Please try again later.');
    console.error('Failed to load messages:', error);
  }
}

async function handleSubmit(event, listingId, ui, currentUser, currentRole) {
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
      sender_id: currentUser.id,
      sender: currentUser.name,
      sender_role: currentRole,
      message,
    });

    ui.input.value = '';
    await loadMessages(listingId, ui, currentUser);
  } catch (error) {
    renderError(ui.statusElement, 'Unable to send message. Please try again later.');
    console.error('Failed to send message:', error);
  } finally {
    ui.sendButton.disabled = false;
    ui.sendButton.textContent = 'Send';
  }
}

function startAutoRefresh(listingId, ui, currentUser) {
  refreshHandle = window.setInterval(() => {
    loadMessages(listingId, ui, currentUser);
  }, 2500);
}

function stopAutoRefresh() {
  if (refreshHandle) {
    window.clearInterval(refreshHandle);
    refreshHandle = null;
  }
}

async function initChatPage() {
  const currentUser = requireCurrentUser();

  if (!currentUser) {
    return;
  }

  const ui = getUi();

  if (
    !ui.statusElement ||
    !ui.messagesList ||
    !ui.form ||
    !ui.input ||
    !ui.sendButton ||
    !ui.container
  ) {
    console.error('Required chat elements are missing.');
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const listingId = params.get('listing_id');
  const listingTitle = params.get('title');
  const whatsappNumber = params.get('whatsapp');

  if (!listingId) {
    renderError(ui.statusElement, 'Listing not found for chat.');
    return;
  }

  let currentRole = 'buyer';

  try {
    const listings = await getListings();
    const listing = listings.find((item) => String(item.id) === String(listingId));

    if (listing) {
      currentRole = String(currentUser.id) === String(listing.seller_id) ? 'seller' : 'buyer';
    }
  } catch (error) {
    console.error('Failed to determine chat role:', error);
  }

  setRoleLabel(ui.roleElement, currentRole);
  renderLoading(ui.statusElement, ui.messagesList);
  await loadMessages(listingId, ui, currentUser);

  ui.form.addEventListener('submit', (event) => {
    handleSubmit(event, listingId, ui, currentUser, currentRole);
  });

  if (ui.whatsappButton) {
    ui.whatsappButton.addEventListener('click', () => {
      openWhatsApp({
        title: listingTitle,
        whatsapp_number: whatsappNumber,
      });
    });
  }

  startAutoRefresh(listingId, ui, currentUser);
  window.addEventListener('beforeunload', stopAutoRefresh, { once: true });
}

document.addEventListener('DOMContentLoaded', () => {
  initChatPage();
});
