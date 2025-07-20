document.addEventListener('DOMContentLoaded', function() {
    // Determine which page is loaded
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const isAdminPage = currentPage === 'admin.html';
    const isClientPage = currentPage === 'client.html';
    const isStudentPage = currentPage === 'student.html';
    const isHomePage = !isAdminPage && !isClientPage && !isStudentPage && currentPage !== 'login.html';
    
    // Get current logged in user if available
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Initialize event storage if it doesn't exist
    if (!localStorage.getItem('events')) {
        localStorage.setItem('events', JSON.stringify([]));
    }
    
    // Common functions
    const eventFunctions = {
        // Get all events from localStorage
        getAllEvents: function() {
            return JSON.parse(localStorage.getItem('events')) || [];
        },
        
        // Save events to localStorage
        saveEvents: function(events) {
            localStorage.setItem('events', JSON.stringify(events));
        },
        
        // Get only upcoming events (filter out past events)
        getUpcomingEvents: function(approvedOnly = false) {
            const events = this.getAllEvents();
            const now = new Date();
            
            return events.filter(event => {
                const isPastEvent = new Date(event.date) <= now;
                const isApproved = event.status === 'approved' || event.status === undefined; // For backward compatibility
                
                // If approvedOnly is true, only return approved upcoming events
                if (approvedOnly) {
                    return !isPastEvent && isApproved;
                }
                
                // Otherwise return all upcoming events
                return !isPastEvent;
            });
        },
        
        // Get pending events (awaiting approval)
        getPendingEvents: function() {
            const events = this.getAllEvents();
            return events.filter(event => event.status === 'pending');
        },
        
        // Get events by submitter email
        getEventsBySubmitter: function(submitterEmail) {
            const events = this.getAllEvents();
            return events.filter(event => 
                event.submitterEmail && event.submitterEmail.toLowerCase() === submitterEmail.toLowerCase()
            );
        },
        
        // Format date for display
        formatDate: function(dateString) {
            const date = new Date(dateString);
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            return date.toLocaleDateString('en-US', options);
        },
        
        // Create unique ID
        createId: function() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        },
        
        // Get status badge HTML
        getStatusBadge: function(status) {
            if (!status || status === 'approved') {
                return '<span class="status-badge approved">Approved</span>';
            } else if (status === 'pending') {
                return '<span class="status-badge pending">Pending</span>';
            } else if (status === 'rejected') {
                return '<span class="status-badge rejected">Rejected</span>';
            }
            return '';
        }
    };
    
    // Admin page functionality
    if (isAdminPage && currentUser && currentUser.role === 'admin') {
        const addEventForm = document.getElementById('addEventForm');
        const messageContainer = document.getElementById('messageContainer');
        const adminEventsList = document.getElementById('adminEventsList');
        const adminNoEventsMessage = document.getElementById('adminNoEventsMessage');
        const adminSearchInput = document.getElementById('adminSearchInput');
        const pendingEventsList = document.getElementById('pendingEventsList');
        const pendingNoEventsMessage = document.getElementById('pendingNoEventsMessage');
        const pendingSearchInput = document.getElementById('pendingSearchInput');
        
        // Add event form submission
        addEventForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const title = document.getElementById('eventTitle').value.trim();
            const description = document.getElementById('eventDescription').value.trim();
            const date = document.getElementById('eventDate').value;
            const contactEmail = document.getElementById('contactEmail').value.trim();
            
            // Validate form
            if (!title || !description || !date || !contactEmail) {
                showMessage('All fields are required', 'error');
                return;
            }
            
            // Create event object
            const event = {
                id: eventFunctions.createId(),
                title,
                description,
                date,
                contactEmail,
                status: 'approved', // Admin-added events are auto-approved
                createdAt: new Date().toISOString(),
                submitterName: currentUser.name,
                submitterEmail: currentUser.email
            };
            
            // Add event to storage
            const events = eventFunctions.getAllEvents();
            events.push(event);
            eventFunctions.saveEvents(events);
            
            // Show success message
            showMessage('Event added successfully', 'success');
            
            // Reset form
            addEventForm.reset();
            
            // Refresh events lists
            displayAdminEvents();
            displayPendingEvents();
        });
        
        // Show message function
        function showMessage(text, type) {
            messageContainer.textContent = text;
            messageContainer.className = `message ${type}`;
            
            // Hide message after 3 seconds
            setTimeout(() => {
                messageContainer.className = 'message';
            }, 3000);
        }
        
        // Display all events in admin panel
        function displayAdminEvents(searchTerm = '') {
            const events = eventFunctions.getAllEvents();
            let filteredEvents = events;
            
            // Filter by search term if provided
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filteredEvents = events.filter(event => 
                    event.title.toLowerCase().includes(term) || 
                    event.description.toLowerCase().includes(term)
                );
            }
            
            // Clear current list
            adminEventsList.innerHTML = '';
            
            // Show or hide no events message
            if (filteredEvents.length === 0) {
                adminNoEventsMessage.style.display = 'block';
            } else {
                adminNoEventsMessage.style.display = 'none';
                
                // Add each event to the list
                filteredEvents.forEach(event => {
                    const eventItem = document.createElement('div');
                    eventItem.className = 'admin-event-item';
                    
                    const isPast = new Date(event.date) < new Date();
                    const statusBadge = eventFunctions.getStatusBadge(event.status);
                    
                    eventItem.innerHTML = `
                        <div class="admin-event-info">
                            <h4>${event.title} ${statusBadge} ${isPast ? '<span style="color: var(--danger-color)">(Past)</span>' : ''}</h4>
                            <p>${eventFunctions.formatDate(event.date)}</p>
                            ${event.submitterName ? `<p><small>Submitted by: ${event.submitterName}</small></p>` : ''}
                        </div>
                        <div class="admin-event-actions">
                            <button class="delete-btn" data-id="${event.id}" title="Delete Event">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    `;
                    
                    adminEventsList.appendChild(eventItem);
                });
                
                // Add event listeners to delete buttons
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const id = this.getAttribute('data-id');
                        deleteEvent(id);
                    });
                });
            }
        }
        
        // Display pending events
        function displayPendingEvents(searchTerm = '') {
            const pendingEvents = eventFunctions.getPendingEvents();
            let filteredEvents = pendingEvents;
            
            // Filter by search term if provided
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filteredEvents = pendingEvents.filter(event => 
                    event.title.toLowerCase().includes(term) || 
                    event.description.toLowerCase().includes(term)
                );
            }
            
            // Clear current list
            pendingEventsList.innerHTML = '';
            
            // Show or hide no events message
            if (filteredEvents.length === 0) {
                pendingNoEventsMessage.style.display = 'block';
            } else {
                pendingNoEventsMessage.style.display = 'none';
                
                // Add each pending event to the list
                filteredEvents.forEach(event => {
                    const eventItem = document.createElement('div');
                    eventItem.className = 'admin-event-item';
                    
                    const isPast = new Date(event.date) < new Date();
                    
                    eventItem.innerHTML = `
                        <div class="admin-event-info">
                            <h4>${event.title} ${isPast ? '<span style="color: var(--danger-color)">(Past)</span>' : ''}</h4>
                            <p>${eventFunctions.formatDate(event.date)}</p>
                            ${event.submitterName ? `<p><small>Submitted by: ${event.submitterName}</small></p>` : ''}
                        </div>
                        <div class="admin-event-actions">
                            <button class="approve-btn" data-id="${event.id}" title="Approve Event">
                                <i class="fas fa-check-circle"></i>
                            </button>
                            <button class="reject-btn" data-id="${event.id}" title="Reject Event">
                                <i class="fas fa-times-circle"></i>
                            </button>
                            <button class="delete-btn" data-id="${event.id}" title="Delete Event">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    `;
                    
                    pendingEventsList.appendChild(eventItem);
                });
                
                // Add event listeners to action buttons
                document.querySelectorAll('.approve-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const id = this.getAttribute('data-id');
                        approveEvent(id);
                    });
                });
                
                document.querySelectorAll('.reject-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const id = this.getAttribute('data-id');
                        rejectEvent(id);
                    });
                });
                
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const id = this.getAttribute('data-id');
                        deleteEvent(id);
                    });
                });
            }
        }
        
        // Delete event function
        function deleteEvent(id) {
            if (confirm('Are you sure you want to delete this event?')) {
                let events = eventFunctions.getAllEvents();
                events = events.filter(event => event.id !== id);
                eventFunctions.saveEvents(events);
                displayAdminEvents();
                displayPendingEvents();
                showMessage('Event deleted successfully', 'success');
            }
        }
        
        // Approve event function
        function approveEvent(id) {
            let events = eventFunctions.getAllEvents();
            const eventIndex = events.findIndex(event => event.id === id);
            
            if (eventIndex !== -1) {
                events[eventIndex].status = 'approved';
                eventFunctions.saveEvents(events);
                displayAdminEvents();
                displayPendingEvents();
                showMessage('Event approved successfully', 'success');
            }
        }
        
        // Reject event function
        function rejectEvent(id) {
            let events = eventFunctions.getAllEvents();
            const eventIndex = events.findIndex(event => event.id === id);
            
            if (eventIndex !== -1) {
                events[eventIndex].status = 'rejected';
                eventFunctions.saveEvents(events);
                displayAdminEvents();
                displayPendingEvents();
                showMessage('Event rejected', 'success');
            }
        }
        
        // Search events
        adminSearchInput.addEventListener('input', function() {
            displayAdminEvents(this.value);
        });
        
        pendingSearchInput.addEventListener('input', function() {
            displayPendingEvents(this.value);
        });
        
        // Initial display of events
        displayAdminEvents();
        displayPendingEvents();
    } 
    // Client page functionality
    else if (isClientPage && currentUser && currentUser.role === 'client') {
        const submitEventForm = document.getElementById('submitEventForm');
        const messageContainer = document.getElementById('messageContainer');
        const clientEventsList = document.getElementById('clientEventsList');
        const clientNoEventsMessage = document.getElementById('clientNoEventsMessage');
        const clientSearchInput = document.getElementById('clientSearchInput');
        
        // Get client info from currentUser
        const clientName = currentUser.name;
        const clientEmail = currentUser.email;
        
        // Pre-fill submitter name field if available
        const submitterNameField = document.getElementById('submitterName');
        if (submitterNameField && clientName) {
            submitterNameField.value = clientName;
        }
        
        // Submit event form
        submitEventForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const title = document.getElementById('eventTitle').value.trim();
            const description = document.getElementById('eventDescription').value.trim();
            const date = document.getElementById('eventDate').value;
            const contactEmail = document.getElementById('contactEmail').value.trim();
            const submitterName = document.getElementById('submitterName').value.trim();
            
            // Validate form
            if (!title || !description || !date || !contactEmail || !submitterName) {
                showMessage('All fields are required', 'error');
                return;
            }
            
            // Create event object with pending status
            const event = {
                id: eventFunctions.createId(),
                title,
                description,
                date,
                contactEmail,
                submitterName,
                submitterEmail: clientEmail, // Use logged in user's email
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            
            // Add event to storage
            const events = eventFunctions.getAllEvents();
            events.push(event);
            eventFunctions.saveEvents(events);
            
            // Show success message
            showMessage('Event submitted for approval', 'success');
            
            // Reset form (except for the submitter name)
            document.getElementById('eventTitle').value = '';
            document.getElementById('eventDescription').value = '';
            document.getElementById('eventDate').value = '';
            document.getElementById('contactEmail').value = '';
            
            // Refresh events list
            displayClientEvents();
        });
        
        // Show message function
        function showMessage(text, type) {
            messageContainer.textContent = text;
            messageContainer.className = `message ${type}`;
            
            // Hide message after 3 seconds
            setTimeout(() => {
                messageContainer.className = 'message';
            }, 3000);
        }
        
        // Display client's events
        function displayClientEvents(searchTerm = '') {
            const clientEvents = eventFunctions.getEventsBySubmitter(clientEmail);
            let filteredEvents = clientEvents;
            
            // Filter by search term if provided
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filteredEvents = clientEvents.filter(event => 
                    event.title.toLowerCase().includes(term) || 
                    event.description.toLowerCase().includes(term)
                );
            }
            
            // Clear current list
            clientEventsList.innerHTML = '';
            
            // Show or hide no events message
            if (filteredEvents.length === 0) {
                clientNoEventsMessage.style.display = 'block';
            } else {
                clientNoEventsMessage.style.display = 'none';
                
                // Add each event to the list
                filteredEvents.forEach(event => {
                    const eventItem = document.createElement('div');
                    eventItem.className = 'admin-event-item';
                    
                    const isPast = new Date(event.date) < new Date();
                    const statusBadge = eventFunctions.getStatusBadge(event.status);
                    
                    eventItem.innerHTML = `
                        <div class="admin-event-info">
                            <h4>${event.title} ${statusBadge} ${isPast ? '<span style="color: var(--danger-color)">(Past)</span>' : ''}</h4>
                            <p>${eventFunctions.formatDate(event.date)}</p>
                        </div>
                    `;
                    
                    clientEventsList.appendChild(eventItem);
                });
            }
        }
        
        // Search client events
        clientSearchInput.addEventListener('input', function() {
            displayClientEvents(this.value);
        });
        
        // Initial display of client events
        displayClientEvents();
    }
    // Student page functionality
    else if (isStudentPage && currentUser && currentUser.role === 'student') {
        const studentEventsList = document.getElementById('studentEventsList');
        const studentNoEventsMessage = document.getElementById('studentNoEventsMessage');
        const studentSearchInput = document.getElementById('studentSearchInput');
        const studentContactModal = document.getElementById('studentContactModal');
        const modalClose = document.querySelector('#studentContactModal .close');
        const studentContactForm = document.getElementById('studentContactForm');
        const studentModalEventTitle = document.getElementById('studentModalEventTitle');
        const studentModalContactEmail = document.getElementById('studentModalContactEmail');
        
        // Pre-fill student name and email if available
        if (currentUser) {
            const studentNameField = document.getElementById('studentName');
            const studentEmailField = document.getElementById('studentEmail');
            
            if (studentNameField && currentUser.name) {
                studentNameField.value = currentUser.name;
            }
            
            if (studentEmailField && currentUser.email) {
                studentEmailField.value = currentUser.email;
            }
        }
        
        // Display approved upcoming events
        function displayStudentEvents(searchTerm = '') {
            // Get only approved upcoming events
            const events = eventFunctions.getUpcomingEvents(true);
            
            // Filter by search term if provided
            let filteredEvents = events;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filteredEvents = events.filter(event => 
                    event.title.toLowerCase().includes(term) || 
                    event.description.toLowerCase().includes(term)
                );
            }
            
            // Clear current list
            studentEventsList.innerHTML = '';
            
            // Show or hide no events message
            if (filteredEvents.length === 0) {
                studentNoEventsMessage.style.display = 'block';
            } else {
                studentNoEventsMessage.style.display = 'none';
                
                // Add each event to the list
                filteredEvents.forEach(event => {
                    const eventCard = document.createElement('div');
                    eventCard.className = 'event-card';
                    
                    // Truncate description if too long
                    const shortDescription = event.description.length > 120 ? 
                        event.description.substring(0, 120) + '...' : 
                        event.description;
                    
                    eventCard.innerHTML = `
                        <div class="event-header">
                            <h3 class="event-title">${event.title}</h3>
                        </div>
                        <div class="event-body">
                            <p class="event-date">
                                <i class="fas fa-calendar-alt"></i> ${eventFunctions.formatDate(event.date)}
                            </p>
                            <p class="event-description">${shortDescription}</p>
                        </div>
                        <div class="event-footer">
                            <button class="btn student-contact-btn" data-id="${event.id}">Contact</button>
                        </div>
                    `;
                    
                    studentEventsList.appendChild(eventCard);
                });
                
                // Add event listeners to contact buttons
                document.querySelectorAll('.student-contact-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const id = this.getAttribute('data-id');
                        openStudentContactModal(id);
                    });
                });
            }
        }
        
        // Open contact modal function
        function openStudentContactModal(eventId) {
            const events = eventFunctions.getAllEvents();
            const event = events.find(e => e.id === eventId);
            
            if (event) {
                studentModalEventTitle.textContent = `Event: ${event.title}`;
                studentModalContactEmail.textContent = event.contactEmail;
                studentContactModal.style.display = 'block';
                
                // Store current event ID for form submission
                studentContactForm.setAttribute('data-event-id', eventId);
            }
        }
        
        // Close modal when clicking the X
        modalClose.addEventListener('click', function() {
            studentContactModal.style.display = 'none';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === studentContactModal) {
                studentContactModal.style.display = 'none';
            }
        });
        
        // Handle contact form submission
        studentContactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // In a real app, this would send the message to the backend
            // For this demo, just show an alert and close the modal
            alert('Your message has been sent! (This is a demo - no actual email was sent)');
            
            // Reset form and close modal
            this.reset();
            studentContactModal.style.display = 'none';
            
            // Re-fill student name and email
            if (currentUser) {
                const studentNameField = document.getElementById('studentName');
                const studentEmailField = document.getElementById('studentEmail');
                
                if (studentNameField && currentUser.name) {
                    studentNameField.value = currentUser.name;
                }
                
                if (studentEmailField && currentUser.email) {
                    studentEmailField.value = currentUser.email;
                }
            }
        });
        
        // Search events
        studentSearchInput.addEventListener('input', function() {
            displayStudentEvents(this.value);
        });
        
        // Initial display of events
        displayStudentEvents();
    } 
    // Homepage functionality (no login required)
    else if (isHomePage) {
        const eventsList = document.getElementById('eventsList');
        const noEventsMessage = document.getElementById('noEventsMessage');
        const searchInput = document.getElementById('searchInput');
        const contactModal = document.getElementById('contactModal');
        const modalClose = document.querySelector('.close');
        const contactForm = document.getElementById('contactForm');
        const modalEventTitle = document.getElementById('modalEventTitle');
        const modalContactEmail = document.getElementById('modalContactEmail');
        
        // Display upcoming events
        function displayUpcomingEvents(searchTerm = '') {
            // Get only approved upcoming events for public view
            const events = eventFunctions.getUpcomingEvents(true);
            
            // Save filtered events back to storage (removes past events)
            const allEvents = eventFunctions.getAllEvents();
            const pastEvents = allEvents.filter(event => new Date(event.date) <= new Date());
            eventFunctions.saveEvents([...events, ...pastEvents]);
            
            let filteredEvents = events;
            
            // Filter by search term if provided
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filteredEvents = events.filter(event => 
                    event.title.toLowerCase().includes(term) || 
                    event.description.toLowerCase().includes(term)
                );
            }
            
            // Clear current list
            eventsList.innerHTML = '';
            
            // Show or hide no events message
            if (filteredEvents.length === 0) {
                noEventsMessage.style.display = 'block';
            } else {
                noEventsMessage.style.display = 'none';
                
                // Add each event to the list
                filteredEvents.forEach(event => {
                    const eventCard = document.createElement('div');
                    eventCard.className = 'event-card';
                    
                    // Truncate description if too long
                    const shortDescription = event.description.length > 120 ? 
                        event.description.substring(0, 120) + '...' : 
                        event.description;
                    
                    eventCard.innerHTML = `
                        <div class="event-header">
                            <h3 class="event-title">${event.title}</h3>
                        </div>
                        <div class="event-body">
                            <p class="event-date">
                                <i class="fas fa-calendar-alt"></i> ${eventFunctions.formatDate(event.date)}
                            </p>
                            <p class="event-description">${shortDescription}</p>
                        </div>
                        <div class="event-footer">
                            <button class="btn contact-btn" data-id="${event.id}">Contact</button>
                        </div>
                    `;
                    
                    eventsList.appendChild(eventCard);
                });
                
                // Add event listeners to contact buttons
                document.querySelectorAll('.contact-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const id = this.getAttribute('data-id');
                        openContactModal(id);
                    });
                });
            }
        }
        
        // Open contact modal function
        function openContactModal(eventId) {
            const events = eventFunctions.getAllEvents();
            const event = events.find(e => e.id === eventId);
            
            if (event) {
                modalEventTitle.textContent = `Event: ${event.title}`;
                modalContactEmail.textContent = event.contactEmail;
                contactModal.style.display = 'block';
                
                // Store current event ID for form submission
                contactForm.setAttribute('data-event-id', eventId);
            }
        }
        
        // Close modal when clicking the X
        modalClose.addEventListener('click', function() {
            contactModal.style.display = 'none';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === contactModal) {
                contactModal.style.display = 'none';
            }
        });
        
        // Handle contact form submission
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // In a real app, this would send the message to the backend
            // For this demo, just show an alert and close the modal
            alert('Your message has been sent! (This is a demo - no actual email was sent)');
            
            // Reset form and close modal
            contactForm.reset();
            contactModal.style.display = 'none';
        });
        
        // Search events
        searchInput.addEventListener('input', function() {
            displayUpcomingEvents(this.value);
        });
        
        // Initial display of events
        displayUpcomingEvents();
    }
}); 