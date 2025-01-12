const API_URL = 'https://todo-app-backend-three-psi.vercel.app';

function loginWithGoogle() {
    window.location.href = `${API_URL}/auth/google`;
}

// Handle the redirect from Google OAuth
function handleAuthRedirect() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const expires = urlParams.get('expires');

    if (token && expires) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('authExpires', expires);
        
        // Clean URL and redirect to index
        window.history.replaceState({}, document.title, '/');
        window.location.href = '/index.html';
    }
}

// Call on page load
handleAuthRedirect(); 