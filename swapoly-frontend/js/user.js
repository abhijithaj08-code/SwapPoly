const USER_STORAGE_KEY = 'user';

export function ensureCurrentUser() {
  const existingUser = localStorage.getItem(USER_STORAGE_KEY);

  if (existingUser) {
    return JSON.parse(existingUser);
  }

  const newUser = {
    id: Date.now(),
    name: `User${Math.floor(Math.random() * 1000)}`,
  };

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
  return newUser;
}

export function getCurrentUser() {
  return ensureCurrentUser();
}
