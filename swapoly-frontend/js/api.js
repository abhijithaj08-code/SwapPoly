const LISTINGS_ENDPOINT = 'http://localhost:5000/api/listings';

const MOCK_LISTINGS = [
  {
    id: 'mock-1',
    title: 'Calculus Textbook (8th Edition)',
    price: 30,
    category_name: 'Books',
    image_url: 'https://via.placeholder.com/600x450?text=Calculus+Book',
    status: 'available',
  },
  {
    id: 'mock-2',
    title: 'TI-84 Graphing Calculator',
    price: 45,
    category_name: 'Electronics',
    image_url: 'https://via.placeholder.com/600x450?text=TI-84',
    status: 'available',
  },
  {
    id: 'mock-3',
    title: 'Desk Lamp',
    price: 12,
    category_name: 'Furniture',
    image_url: 'https://via.placeholder.com/600x450?text=Desk+Lamp',
    status: 'sold',
  },
];

export async function getListings() {
  try {
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

    return {
      listings: Array.isArray(data) ? data : [],
      usingMockData: false,
      error: null,
    };
  } catch (error) {
    console.warn('Using mock data (backend unavailable)');

    return {
      listings: MOCK_LISTINGS,
      usingMockData: true,
      error,
    };
  }
}
