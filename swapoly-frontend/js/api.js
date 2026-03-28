const LISTINGS_ENDPOINT = 'http://localhost:5000/api/listings';
const MESSAGES_ENDPOINT = 'http://localhost:5000/api/messages';

export async function getListings() {
  const response = await fetch(LISTINGS_ENDPOINT, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();
  console.log('Listings from API:', data);
  return Array.isArray(data) ? data : [];
}

export async function markAsSold(id) {
  const response = await fetch(`${LISTINGS_ENDPOINT}/${id}/sold`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json().catch(() => null);
  return data;
}

export async function createListing(data) {
  console.log('Sending payload:', data);

  const response = await fetch(LISTINGS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    console.error('Create listing failed:', {
      status: response.status,
      body: errorText,
    });
    throw new Error(errorText || 'Failed to create listing');
  }

  return response.json();
}

export async function getMessages(listingId, currentUserId, otherUserId, conversationId) {
  const params = new URLSearchParams();

  if (currentUserId && otherUserId) {
    params.set('current_user_id', currentUserId);
    params.set('other_user_id', otherUserId);
  }

  if (conversationId) {
    params.set('conversation_id', conversationId);
  }

  const suffix = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${MESSAGES_ENDPOINT}/${listingId}${suffix}`, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function createMessage(data) {
  const response = await fetch(MESSAGES_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || 'Failed to send message');
  }

  return response.json();
}
