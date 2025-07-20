document.addEventListener('DOMContentLoaded', function() {
    // Current page detection
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Pages that require specific role authentication
    const protectedPages = {
        'student.html': 'student',
        'client.html': 'client',
        'admin.html': 'admin'
    };
    
    // Check if the current page is protected
    if (protectedPages[currentPage]) {
        const requiredRole = protectedPages[currentPage];
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // If no user is logged in or the user role doesn't match, redirect to login
        if (!currentUser || currentUser.role !== requiredRole) {
            window.location.href = 'login.html';
            return;
        }
        
        // Update navigation with user info
        updateNavWithUserInfo(currentUser);
    } else {
        // For non-protected pages, just check if user is logged in
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            updateNavWithUserInfo(currentUser);
        }
    }
    
    function updateNavWithUserInfo(user) {
        // Get the navigation links container
        const navLinks = document.querySelector('.nav-links');
        
        if (navLinks) {
            // Create user info element
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.innerHTML = `
                <span class="username">${user.name} (${user.role})</span>
                <a href="#" id="logoutBtn" class="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
            `;
            
            // Add to navigation
            navLinks.appendChild(userInfo);
            
            // Add logout functionality
            document.getElementById('logoutBtn').addEventListener('click', function(e) {
                e.preventDefault();
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            });
        }
    }
}); 