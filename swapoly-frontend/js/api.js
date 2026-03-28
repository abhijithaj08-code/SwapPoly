const LISTINGS_ENDPOINT = 'http://localhost:5000/api/listings';

export async function getListings() {
  const response = await fetch(LISTINGS_ENDPOINT, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();
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
