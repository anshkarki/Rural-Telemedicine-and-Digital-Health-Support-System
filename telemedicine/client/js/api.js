// API Base URL
const API_BASE = '/api';

// ──────── AUTH HELPERS ────────
function getToken() { return localStorage.getItem('tm_token'); }
function getUser() { 
  const u = localStorage.getItem('tm_user');
  return u ? JSON.parse(u) : null;
}
function setAuth(token, user) {
  localStorage.setItem('tm_token', token);
  localStorage.setItem('tm_user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('tm_token');
  localStorage.removeItem('tm_user');
}
function requireAuth(role) {
  const user = getUser();
  const token = getToken();
  if (!user || !token) {
    window.location.href = '/index.html';
    return false;
  }
  if (role && user.role !== role) {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

// ──────── FETCH WRAPPER ────────
async function api(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  const token = getToken();
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  
  const res = await fetch(API_BASE + path, opts);
  const data = await res.json().catch(() => ({}));
  
  if (res.status === 401) {
    clearAuth();
    window.location.href = '/index.html';
    throw new Error('Session expired');
  }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const GET = (path) => api('GET', path);
const POST = (path, body) => api('POST', path, body);
const PATCH = (path, body) => api('PATCH', path, body);
const PUT = (path, body) => api('PUT', path, body);
const DELETE = (path) => api('DELETE', path);

// ──────── TOAST NOTIFICATIONS ────────
function showToast(message, type = 'success') {
  const existing = document.querySelector('.tm-toast');
  if (existing) existing.remove();
  
  const colors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-sky-500',
    warning: 'bg-amber-500'
  };
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  };
  
  const toast = document.createElement('div');
  toast.className = `tm-toast fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl text-white shadow-2xl ${colors[type]} transform translate-x-full transition-transform duration-300`;
  toast.innerHTML = `
    <span class="text-lg font-bold">${icons[type]}</span>
    <span class="font-medium">${message}</span>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.style.transform = 'translateX(0)', 10);
  setTimeout(() => {
    toast.style.transform = 'translateX(150%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ──────── LOADING SPINNER ────────
function showLoading(el, text = 'Loading...') {
  el.disabled = true;
  el._originalContent = el.innerHTML;
  el.innerHTML = `<span class="flex items-center gap-2"><svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>${text}</span>`;
}
function hideLoading(el) {
  el.disabled = false;
  if (el._originalContent) el.innerHTML = el._originalContent;
}

// ──────── HELPERS ────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}
function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN');
}
function statusBadge(status) {
  const map = {
    pending: 'bg-amber-100 text-amber-700',
    payment_pending: 'bg-orange-100 text-orange-700',
    confirmed: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-sky-100 text-sky-700',
    cancelled: 'bg-red-100 text-red-700',
    open: 'bg-red-100 text-red-700',
    'in-progress': 'bg-amber-100 text-amber-700',
    resolved: 'bg-emerald-100 text-emerald-700',
    paid: 'bg-emerald-100 text-emerald-700',
    unpaid: 'bg-red-100 text-red-700',
    low: 'bg-sky-100 text-sky-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700 animate-pulse',
    sent: 'bg-sky-100 text-sky-700',
    accepted: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    closed: 'bg-gray-100 text-gray-700'
  };
  return `<span class="px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-700'}">${status?.replace('_',' ')?.toUpperCase()}</span>`;
}

function emptyState(msg, icon = '📋') {
  return `<div class="flex flex-col items-center justify-center py-16 text-gray-400">
    <span class="text-5xl mb-4">${icon}</span>
    <p class="text-lg font-medium">${msg}</p>
  </div>`;
}

// Logout
function logout() {
  clearAuth();
  window.location.href = '/index.html';
}
