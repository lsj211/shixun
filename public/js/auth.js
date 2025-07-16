export function checkAuth() {
  const token = localStorage.getItem('token');
  console.log('检查 token 是否存在：', token !== null);
  return token !== null;
}

export function redirectToLogin() {
  localStorage.removeItem('token');
  window.location.href = '/index.html';
}