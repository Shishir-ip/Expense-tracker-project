// ============================================================
// CONFIGURATION - Load from environment or use defaults
// ============================================================
const CONFIG = {
    SUPABASE_URL: 'https://hjblscnpnnsvkjpbydtl.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqYmxzY25wbm5zdmtqcGJ5ZHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3ODQ0NjYsImV4cCI6MjA5NzM2MDQ2Nn0.f1rfynEbzFBahYRkAyMpSGOWpNQAS0XRcIf7hMlK92U',
    OPENROUTER_API_KEY: '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',
    OPENROUTER_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
    OPENROUTER_MODEL: 'openrouter/free',
    AI_MAX_TOKENS: 4096
};

// ============================================================
// CATEGORIES
// ============================================================
const CATEGORIES = [
    { id: 'food', name: 'Food', icon: 'fa-utensils', color: '#f59e0b' },
    { id: 'transport', name: 'Transport', icon: 'fa-bus', color: '#3b82f6' },
    { id: 'shopping', name: 'Shopping', icon: 'fa-shopping-bag', color: '#ec4899' },
    { id: 'entertainment', name: 'Fun', icon: 'fa-gamepad', color: '#8b5cf6' },
    { id: 'bills', name: 'Bills', icon: 'fa-file-invoice-dollar', color: '#ef4444' },
    { id: 'health', name: 'Health', icon: 'fa-heartbeat', color: '#10b981' },
    { id: 'education', name: 'Education', icon: 'fa-graduation-cap', color: '#06b6d4' },
    { id: 'other', name: 'Other', icon: 'fa-ellipsis-h', color: '#6b7280' }
];

// ============================================================
// QUICK PRESETS
// ============================================================
const QUICK_PRESETS = [
    { id: 'khichuri', label: 'Khichuri (৳100)', title: 'Khichuri', amount: 100, category: 'food' },
    { id: 'porota_dal_dim', label: 'Porota 3, Dal Vaji, Dim (৳60)', title: 'Porota, Dal Vaji, Dim', amount: 60, category: 'food' },
    { id: 'bus_ticket', label: 'Bus Ticket', title: 'Bus Ticket', amount: 550, category: 'transport' }
];

// ============================================================
// LOCAL DATE HELPERS
// ============================================================
function getLocalDateStr(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getLocalMonthStr(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getLocalYearStr(d = new Date()) {
    return String(d.getFullYear());
}

function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

// ============================================================
// ESCAPE HTML HELPER
// ============================================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// FORMAT CURRENCY
// ============================================================
function formatCurrency(amount) {
    return `৳${Number(amount).toLocaleString('en-IN')}`;
}

// ============================================================
// NAVIGATION HELPER - Clean URLs without .html
// ============================================================
function navigateTo(page) {
    // Use History API for clean URLs
    const url = window.location.origin + '/' + page;
    window.history.pushState({ page }, '', url);
    loadPage(page);
}

function loadPage(page) {
    // Map page names to actual files
    const pageMap = {
        '': 'index.html',
        'borrow': 'borrow.html',
        'transactions': 'transactions.html',
        'insights': 'insights.html',
        'account': 'account.html'
    };
    
    const file = pageMap[page] || 'index.html';
    // For SPA behavior, you would fetch and render content here
    // For now, we'll do a simple redirect that Vercel will handle with rewrites
    if (page && page !== '') {
        window.location.href = '/' + page;
    }
}

// Handle browser back/forward
window.addEventListener('popstate', (event) => {
    const page = event.state?.page || '';
    loadPage(page);
});

// ============================================================
// SESSION MANAGEMENT WITH REMEMBER ME
// ============================================================
const SESSION_KEY = 'expense_tracker_session';
const REMEMBER_KEY = 'expense_tracker_remember';

function saveSession(userData, rememberMe = false) {
    const sessionData = {
        userId: userData.id,
        email: userData.email,
        username: userData.username,
        name: userData.name,
        authenticated: true,
        timestamp: Date.now()
    };
    
    if (rememberMe) {
        // Store in localStorage for persistence across sessions
        localStorage.setItem(REMEMBER_KEY, JSON.stringify(sessionData));
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

function checkSession() {
    try {
        // First check sessionStorage
        let data = sessionStorage.getItem(SESSION_KEY);
        if (data) {
            return JSON.parse(data);
        }
        
        // Then check localStorage (remember me)
        data = localStorage.getItem(REMEMBER_KEY);
        if (data) {
            const sessionData = JSON.parse(data);
            // Restore to sessionStorage
            sessionStorage.setItem(SESSION_KEY, data);
            return sessionData;
        }
        
        return null;
    } catch (e) {
        console.error('Session check error:', e);
        return null;
    }
}

function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(REMEMBER_KEY);
}

function isAuthenticated() {
    const session = checkSession();
    return session && session.authenticated;
}

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

// ============================================================
// CHECK SESSION BEFORE NAVIGATING
// ============================================================
function checkSessionBeforeNavigate() {
    if (!isAuthenticated()) {
        showToast('Please log in first', 'warning');
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
        return false;
    }
    return true;
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${escapeHtml(message)}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================
// THEME TOGGLE
// ============================================================
function toggleTheme() {
    document.body.classList.toggle('dark');
    const icon = document.getElementById('themeIcon');
    const isDark = document.body.classList.contains('dark');
    
    if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    // Save preference
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        const icon = document.getElementById('themeIcon');
        if (icon) icon.className = 'fas fa-sun';
    }
}
