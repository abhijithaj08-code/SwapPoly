import { createMessage, getListings, getMessages } from './api.js';
import { renderError, renderLoading } from './ui.js';
import { getCurrentUser, requireCurrentUser } from './user.js';

let refreshHandle = null;

function getUi() {
  return {
    statusElement: document.getElementById('chat-status'),
    roleElement: document.getElementById('chat-role'),
    buyerSelection: document.getElementById('buyer-selection'),
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

function setStatus(statusElement, message, isError = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle('is-error', isError);
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
  messagesList.scrollTo({
    top: messagesList.scrollHeight,
    behavior: 'smooth',
  });
}

function getBuyerOptions(messages, sellerId) {
  const buyers = new Map();

  messages.forEach((msg) => {
    const senderId = String(msg.sender_id);
    const receiverId = String(msg.receiver_id);
    const normalizedSellerId = String(sellerId);

    if (senderId !== normalizedSellerId) {
      buyers.set(senderId, msg.sender || `User${senderId}`);
      return;
    }

    if (receiverId && receiverId !== normalizedSellerId && !buyers.has(receiverId)) {
      buyers.set(receiverId, `User${receiverId}`);
    }
  });

  return Array.from(buyers.entries()).map(([id, name]) => ({ id, name }));
}

function renderBuyerSelection(container, buyers, selectedBuyerId, onSelect) {
  if (!container) {
    return;
  }

  container.textContent = '';

  if (buyers.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'status-message buyer-empty';
    empty.textContent = 'No buyers have messaged this listing yet.';
    container.appendChild(empty);
    return;
  }

  buyers.forEach((buyer) => {
    const item = document.createElement('div');
    item.className = 'buyer-item';
    if (String(selectedBuyerId) === String(buyer.id)) {
      item.classList.add('active');
    }
    item.textContent = buyer.name;
    item.addEventListener('click', () => {
      onSelect(buyer.id);
    });
    container.appendChild(item);
  });
}

async function loadMessages(listingId, ui, currentUser, otherUserId, conversationId) {
  try {
    const messages = await getMessages(listingId, currentUser.id, otherUserId, conversationId);
    ui.statusElement.textContent = '';
    ui.statusElement.classList.remove('is-error');
    renderMessages(ui.messagesList, messages, currentUser);
  } catch (error) {
    renderError(ui.statusElement, 'Unable to load messages. Please try again later.');
    console.error('Failed to load messages:', error);
  }
}

async function handleSubmit(event, listingId, ui, currentUser, currentRole, otherUserId, conversationId) {
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
      receiver_id: otherUserId,
      conversation_id: conversationId,
      sender: currentUser.name,
      sender_role: currentRole,
      message,
    });

    ui.input.value = '';
    await loadMessages(listingId, ui, currentUser, otherUserId, conversationId);
  } catch (error) {
    renderError(ui.statusElement, 'Unable to send message. Please try again later.');
    console.error('Failed to send message:', error);
  } finally {
    ui.sendButton.disabled = false;
    ui.sendButton.textContent = 'Send';
  }
}

function startAutoRefresh(listingId, ui, currentUser, otherUserId, conversationId) {
  refreshHandle = window.setInterval(() => {
    loadMessages(listingId, ui, currentUser, otherUserId, conversationId);
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
  const sellerId = params.get('seller_id');
  let buyerId = params.get('buyer_id');

  if (!listingId) {
    renderError(ui.statusElement, 'Listing not found for chat.');
    return;
  }

  let currentRole = 'buyer';
  let otherUserId = null;
  let conversationId = null;
  let listing = null;

  try {
    const listings = await getListings();
    listing = listings.find((item) => String(item.id) === String(listingId));

    if (listing) {
      currentRole = String(currentUser.id) === String(listing.seller_id) ? 'seller' : 'buyer';
      buyerId =
        buyerId ||
        (currentRole === 'buyer' ? String(currentUser.id) : '');
      otherUserId =
        currentRole === 'seller'
          ? buyerId
          : String(listing.seller_id);
      conversationId =
        buyerId
          ? `${listingId}_${buyerId}`
          : null;
    }
  } catch (error) {
    console.error('Failed to determine chat role:', error);
  }

  setRoleLabel(ui.roleElement, currentRole);

  async function refreshConversation(selectedBuyerId = buyerId) {
    buyerId = selectedBuyerId;
    otherUserId =
      currentRole === 'seller'
        ? buyerId
        : String(listing?.seller_id ?? sellerId ?? '');
    conversationId = buyerId ? `${listingId}_${buyerId}` : null;

    if (currentRole === 'seller') {
      const allListingMessages = await getMessages(listingId);
      const buyers = getBuyerOptions(allListingMessages, listing?.seller_id ?? sellerId);
      renderBuyerSelection(ui.buyerSelection, buyers, buyerId, async (nextBuyerId) => {
        const nextParams = new URLSearchParams(window.location.search);
        nextParams.set('buyer_id', nextBuyerId);
        window.history.replaceState({}, '', `./chat.html?${nextParams.toString()}`);
        stopAutoRefresh();
        const ready = await refreshConversation(nextBuyerId);
        if (ready) {
          startAutoRefresh(listingId, ui, currentUser, otherUserId, conversationId);
        }
      });
    } else if (ui.buyerSelection) {
      ui.buyerSelection.textContent = '';
    }

    if (!otherUserId || !conversationId) {
      setStatus(
        ui.statusElement,
        currentRole === 'seller'
          ? 'Select a buyer to start chat'
          : 'Unable to determine chat participants.',
        true,
      );
      ui.messagesList.textContent = '';
      const emptyState = document.createElement('p');
      emptyState.className = 'status-message';
      emptyState.textContent =
        currentRole === 'seller'
          ? 'Select a buyer to start chatting'
          : 'No conversation available.';
      ui.messagesList.appendChild(emptyState);
      ui.sendButton.disabled = true;
      ui.input.disabled = true;
      return false;
    }

    ui.sendButton.disabled = false;
    ui.input.disabled = false;
    renderLoading(ui.statusElement, ui.messagesList);
    await loadMessages(listingId, ui, currentUser, otherUserId, conversationId);
    return true;
  }

  const hasConversation = await refreshConversation();

  ui.form.addEventListener('submit', (event) => {
    if (!otherUserId || !conversationId) {
      event.preventDefault();
      return;
    }
    handleSubmit(event, listingId, ui, currentUser, currentRole, otherUserId, conversationId);
  });

  if (ui.whatsappButton) {
    ui.whatsappButton.addEventListener('click', () => {
      openWhatsApp({
        title: listingTitle,
        whatsapp_number: whatsappNumber,
      });
    });
  }

  if (hasConversation) {
    startAutoRefresh(listingId, ui, currentUser, otherUserId, conversationId);
  }
  window.addEventListener('beforeunload', stopAutoRefresh, { once: true });
}

document.addEventListener('DOMContentLoaded', () => {
  initChatPage();
});
