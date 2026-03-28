const USER_STORAGE_KEY = 'user';
const LOGIN_PAGE = './login.html';

export function getCurrentUser() {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

export function setCurrentUser(name) {
  const user = {
    id: Date.now(),
    name,
  };

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  return user;
}

export function requireCurrentUser() {
  const user = getCurrentUser();

  if (!user) {
    window.location.href = LOGIN_PAGE;
    return null;
  }

  return user;
}

export function logoutCurrentUser() {
  localStorage.removeItem(USER_STORAGE_KEY);
  window.location.href = LOGIN_PAGE;
}
