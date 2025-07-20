document.addEventListener('DOMContentLoaded', function() {
    // Initialize default users if they don't exist
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            {
                username: 'admin',
                password: 'admin123',
                name: 'Administrator',
                email: 'admin@eventhub.com',
                role: 'admin'
            },
            {
                username: 'student',
                password: 'student123',
                name: 'Demo Student',
                email: 'student@example.com',
                role: 'student'
            },
            {
                username: 'client',
                password: 'client123',
                name: 'Demo Client',
                email: 'client@example.com',
                role: 'client'
            }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }

    // Get DOM elements
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginMessage = document.getElementById('loginMessage');
    const registerMessage = document.getElementById('registerMessage');
    const studentTab = document.getElementById('studentTab');
    const clientTab = document.getElementById('clientTab');
    const adminTab = document.getElementById('adminTab');
    const registerStudentTab = document.getElementById('registerStudentTab');
    const registerClientTab = document.getElementById('registerClientTab');
    const userRoleInput = document.getElementById('userRole');
    const registerRoleInput = document.getElementById('registerRole');
    const registerToggle = document.getElementById('registerToggle');
    const loginToggle = document.getElementById('loginToggle');
    const registerContainer = document.getElementById('registerContainer');
    const loginContainer = document.querySelector('.login-container:not([id])');

    // Check if user is already logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        redirectToUserPortal(currentUser.role);
    }

    // Check if a role was selected from the home page
    const selectedRole = localStorage.getItem('selectedRole');
    if (selectedRole && userRoleInput) {
        setActiveLoginTab(selectedRole);
        // Clear the selected role so it doesn't persist on page refresh
        localStorage.removeItem('selectedRole');
    }

    // Toggle between login and register views
    if (registerToggle) {
        registerToggle.addEventListener('click', function() {
            loginContainer.style.display = 'none';
            registerContainer.style.display = 'block';
        });
    }

    if (loginToggle) {
        loginToggle.addEventListener('click', function() {
            registerContainer.style.display = 'none';
            loginContainer.style.display = 'block';
        });
    }

    // Role tab selection for login
    if (studentTab) {
        studentTab.addEventListener('click', function() {
            setActiveLoginTab('student');
        });
    }

    if (clientTab) {
        clientTab.addEventListener('click', function() {
            setActiveLoginTab('client');
        });
    }

    if (adminTab) {
        adminTab.addEventListener('click', function() {
            setActiveLoginTab('admin');
        });
    }

    // Role tab selection for register
    if (registerStudentTab) {
        registerStudentTab.addEventListener('click', function() {
            setActiveRegisterTab('student');
        });
    }

    if (registerClientTab) {
        registerClientTab.addEventListener('click', function() {
            setActiveRegisterTab('client');
        });
    }

    // Default active tabs
    if (userRoleInput && !selectedRole) {
        setActiveLoginTab('student');
    }
    
    if (registerRoleInput) {
        setActiveRegisterTab('student');
    }

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const role = userRoleInput.value;

            // Validate login
            if (!username || !password) {
                showLoginMessage('Please enter both username and password', 'error');
                return;
            }

            // Check if user exists
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.username === username && u.password === password);

            if (!user) {
                showLoginMessage('Invalid username or password', 'error');
                return;
            }

            // Check if user role matches selected role
            if (user.role !== role) {
                showLoginMessage(`This account is not registered as a ${role}. Please select the correct role.`, 'error');
                return;
            }

            // Login successful
            localStorage.setItem('currentUser', JSON.stringify(user));
            redirectToUserPortal(user.role);
        });
    }

    // Handle register form submission
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const username = document.getElementById('registerUsername').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const role = registerRoleInput.value;

            // Validate form
            if (!name || !email || !username || !password || !confirmPassword) {
                showRegisterMessage('All fields are required', 'error');
                return;
            }

            if (password !== confirmPassword) {
                showRegisterMessage('Passwords do not match', 'error');
                return;
            }

            // Check if username already exists
            const users = JSON.parse(localStorage.getItem('users')) || [];
            if (users.some(u => u.username === username)) {
                showRegisterMessage('Username already exists', 'error');
                return;
            }

            // Check if email already exists
            if (users.some(u => u.email === email)) {
                showRegisterMessage('Email already exists', 'error');
                return;
            }

            // Create new user
            const newUser = {
                username,
                password,
                name,
                email,
                role
            };

            // Add user to localStorage
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            // Auto login the new user
            localStorage.setItem('currentUser', JSON.stringify(newUser));
            
            // Show success message and redirect
            showRegisterMessage('Registration successful! Redirecting...', 'success');
            setTimeout(() => {
                redirectToUserPortal(role);
            }, 1500);
        });
    }

    // Helper Functions
    function setActiveLoginTab(role) {
        if (!studentTab || !clientTab || !adminTab) return;

        studentTab.classList.remove('active');
        clientTab.classList.remove('active');
        adminTab.classList.remove('active');

        switch (role) {
            case 'student':
                studentTab.classList.add('active');
                break;
            case 'client':
                clientTab.classList.add('active');
                break;
            case 'admin':
                adminTab.classList.add('active');
                break;
        }

        userRoleInput.value = role;
    }

    function setActiveRegisterTab(role) {
        if (!registerStudentTab || !registerClientTab) return;

        registerStudentTab.classList.remove('active');
        registerClientTab.classList.remove('active');

        switch (role) {
            case 'student':
                registerStudentTab.classList.add('active');
                break;
            case 'client':
                registerClientTab.classList.add('active');
                break;
        }

        registerRoleInput.value = role;
    }

    function showLoginMessage(message, type) {
        if (!loginMessage) return;
        loginMessage.textContent = message;
        loginMessage.className = `login-message message ${type}`;
        loginMessage.style.display = 'block';
    }

    function showRegisterMessage(message, type) {
        if (!registerMessage) return;
        registerMessage.textContent = message;
        registerMessage.className = `login-message message ${type}`;
        registerMessage.style.display = 'block';
    }

    function redirectToUserPortal(role) {
        switch (role) {
            case 'student':
                window.location.href = 'student.html';
                break;
            case 'client':
                window.location.href = 'client.html';
                break;
            case 'admin':
                window.location.href = 'admin.html';
                break;
            default:
                window.location.href = 'index.html';
        }
    }
}); 