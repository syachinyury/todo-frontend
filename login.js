const API_URL = 'https://todo-app-backend-three-psi.vercel.app';
const FRONTEND_URL = 'https://todo-frontend-self-120125.vercel.app';

function loginWithGoogle() {
    window.location.href = `${API_URL}/auth/google`;
}

// Handle the redirect from Google OAuth
function handleAuthRedirect() {
    console.log('Current URL:', window.location.href);
    console.log('Search params:', window.location.search);

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const expires = urlParams.get('expires');

    console.log('Auth Redirect:', {
        hasToken: !!token,
        hasExpires: !!expires,
        expires: expires,
        rawToken: token
    });

    if (token && expires) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('authExpires', expires);
        
        console.log('Stored auth data:', {
            token: localStorage.getItem('authToken'),
            expires: localStorage.getItem('authExpires')
        });

        // Clean URL and redirect to index using full URL
        window.history.replaceState({}, document.title, '/');
        window.location.href = `${FRONTEND_URL}/index.html`;
    } else {
        console.log('Missing token or expires');
    }
}

// Call on page load
handleAuthRedirect(); 