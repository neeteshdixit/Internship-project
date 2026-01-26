/**
 * Chat Application - Frontend Logic
 * Handles authentication, messaging, and real-time updates
 */

// ===== STATE MANAGEMENT =====
let stompClient = null;
let currentUser = null;
let currentConversationId = null;
let currentConversationType = null;
let usersList = [];
let groupsList = [];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // ===== DOM ELEMENTS =====
    const authModal = document.getElementById('authModal');
    const chatApp = document.getElementById('chatApp');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const currentUserEl = document.getElementById('currentUser');
    const userStatusEl = document.getElementById('userStatus');
    const messagesList = document.getElementById('messagesList');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const notification = document.getElementById('notification');

    // Store in window for global access
    window.authModal = authModal;
    window.chatApp = chatApp;
    window.loginForm = loginForm;
    window.registerForm = registerForm;
    window.currentUserEl = currentUserEl;
    window.userStatusEl = userStatusEl;
    window.messagesList = messagesList;
    window.messageInput = messageInput;
    window.sendBtn = sendBtn;
    window.logoutBtn = logoutBtn;
    window.notification = notification;

    // ===== AUTHENTICATION EVENTS =====
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (registerBtn) registerBtn.addEventListener('click', handleRegister);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // ===== CHAT EVENTS =====
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // ===== SIDEBAR EVENTS =====
    const newChatBtn = document.getElementById('newChatBtn');
    const createGroupBtn = document.getElementById('createGroupBtn');
    const startConvBtn = document.getElementById('startConvBtn');
    const createGroupSubmitBtn = document.getElementById('createGroupSubmitBtn');
    
    if (newChatBtn) newChatBtn.addEventListener('click', () => openModal('newChatModal'));
    if (createGroupBtn) createGroupBtn.addEventListener('click', () => openModal('createGroupModal'));
    if (startConvBtn) startConvBtn.addEventListener('click', startNewConversation);
    if (createGroupSubmitBtn) createGroupSubmitBtn.addEventListener('click', createGroup);

    // ===== CRM EVENTS =====
    const addInteractionBtn = document.getElementById('addInteractionBtn');
    const addOpportunityBtn = document.getElementById('addOpportunityBtn');
    if (addInteractionBtn) addInteractionBtn.addEventListener('click', showAddInteractionForm);
    if (addOpportunityBtn) addOpportunityBtn.addEventListener('click', showAddOpportunityForm);

    // Check if already authenticated
    if (isAuthenticated()) {
        initializeApp();
    }
});

// ===== AUTHENTICATION FUNCTIONS =====

async function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorEl = document.getElementById('loginError');

    if (!username || !password) {
        errorEl.textContent = 'Please enter username and password';
        return;
    }

    try {
        await AuthAPI.login(username, password);
        currentUser = username;
        initializeApp();
    } catch (error) {
        errorEl.textContent = error.message;
        showNotification(error.message, 'error');
    }
}

async function handleRegister() {
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const confirmPassword = document.getElementById('regConfirmPassword').value.trim();
    const errorEl = document.getElementById('registerError');

    if (!username || !email || !password || !confirmPassword) {
        errorEl.textContent = 'Please fill all fields';
        return;
    }

    if (password !== confirmPassword) {
        errorEl.textContent = 'Passwords do not match';
        return;
    }

    if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters';
        return;
    }

    try {
        await AuthAPI.register(username, email, password);
        errorEl.textContent = '';
        showNotification('Registration successful! Please login.', 'success');
        toggleAuthForm();
    } catch (error) {
        errorEl.textContent = error.message;
        showNotification(error.message, 'error');
    }
}

function handleLogout() {
    if (stompClient && stompClient.connected) {
        stompClient.disconnect(completeLogout);
    } else {
        completeLogout();
    }
}

function completeLogout() {
    AuthAPI.logout();
    currentUser = null;
    stompClient = null;
    if (window.authModal) window.authModal.classList.add('active');
    if (window.chatApp) window.chatApp.style.display = 'none';
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').textContent = '';
    showNotification('Logged out successfully', 'success');
}

// ===== INITIALIZATION =====

function initializeApp() {
    if (window.authModal) window.authModal.classList.remove('active');
    if (window.chatApp) window.chatApp.style.display = 'flex';
    if (window.currentUserEl) window.currentUserEl.textContent = currentUser;
    connectWebSocket();
    loadUsers();
    loadGroups();
}

// ===== WEBSOCKET CONNECTION =====

function connectWebSocket() {
    const socket = new SockJS('/api/ws');
    stompClient = Stomp.over(socket);

    stompClient.connect(
        { 'Authorization': `Bearer ${getAuthToken()}` },
        (frame) => {
            console.log('Connected:', frame);
            if (window.userStatusEl) {
                window.userStatusEl.textContent = 'Online';
                window.userStatusEl.style.background = '#27ae60';
            }

            stompClient.subscribe(`/user/${currentUser}/messages`, (message) => {
                handleIncomingMessage(JSON.parse(message.body));
            });

            stompClient.subscribe(`/topic/groups`, (message) => {
                handleGroupMessage(JSON.parse(message.body));
            });
        },
        (error) => {
            console.error('WebSocket error:', error);
            if (window.userStatusEl) {
                window.userStatusEl.textContent = 'Offline';
                window.userStatusEl.style.background = '#bdc3c7';
            }
            setTimeout(connectWebSocket, 5000);
        }
    );
}

// ===== MESSAGE HANDLING =====

async function sendMessage() {
    if (!window.messageInput) {
        showNotification('Message input not available', 'error');
        return;
    }
    
    const content = window.messageInput.value.trim();
    if (!content || !currentConversationId) {
        showNotification('Select a conversation first', 'error');
        return;
    }

    try {
        if (currentConversationType === 'user') {
            await MessageAPI.sendMessage(currentUser, currentConversationId, null, content, 'TEXT');
        } else if (currentConversationType === 'group') {
            await MessageAPI.sendMessage(currentUser, null, currentConversationId, content, 'TEXT');
        }
        window.messageInput.value = '';
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function handleIncomingMessage(message) {
    if (message.senderId === currentConversationId || message.receiverId === currentUser) {
        displayMessage(message);
    }
}

function handleGroupMessage(message) {
    if (message.groupId === currentConversationId) {
        displayMessage(message);
    }
}

function displayMessage(message) {
    if (!window.messagesList) return;
    
    const messageEl = document.createElement('li');
    messageEl.className = `message ${message.senderId === currentUser ? 'own' : 'other'}`;

    const time = new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageEl.innerHTML = `
        <div class="message-bubble">
            ${escapeHtml(message.content)}
            <div class="message-time">${time}</div>
        </div>
    `;

    window.messagesList.appendChild(messageEl);
    if (window.messagesList.parentElement) {
        window.messagesList.parentElement.scrollTop = window.messagesList.parentElement.scrollHeight;
    }
}

// ===== USER & GROUP MANAGEMENT =====

async function loadUsers() {
    try {
        usersList = await UserAPI.getAllUsers();
        renderUsersList();
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

async function loadGroups() {
    try {
        groupsList = await GroupAPI.getAllGroups();
        renderGroupsList();
    } catch (error) {
        console.error('Failed to load groups:', error);
    }
}

function renderUsersList() {
    const usersContainer = document.getElementById('usersList');
    usersContainer.innerHTML = '';

    usersList.forEach(user => {
        if (user.username !== currentUser) {
            const userEl = document.createElement('div');
            userEl.className = 'user-item';
            userEl.innerHTML = `
                <div class="user-avatar">${user.username[0].toUpperCase()}</div>
                <span>${user.username}</span>
                <div class="user-status-indicator ${user.online ? '' : 'offline'}"></div>
            `;
            userEl.addEventListener('click', () => selectUser(user));
            usersContainer.appendChild(userEl);
        }
    });
}

function renderGroupsList() {
    const groupsContainer = document.getElementById('groupsList');
    groupsContainer.innerHTML = '';

    groupsList.forEach(group => {
        const groupEl = document.createElement('div');
        groupEl.className = 'group-item';
        groupEl.textContent = group.name;
        groupEl.addEventListener('click', () => selectGroup(group));
        groupsContainer.appendChild(groupEl);
    });
}

function selectUser(user) {
    currentConversationId = user.id;
    currentConversationType = 'user';
    document.getElementById('chatTitle').textContent = user.username;
    loadConversationMessages();
}

function selectGroup(group) {
    currentConversationId = group.id;
    currentConversationType = 'group';
    document.getElementById('chatTitle').textContent = group.name;
    loadConversationMessages();
}

async function loadConversationMessages() {
    if (!window.messagesList) {
        console.warn('messagesList not available');
        return;
    }
    
    window.messagesList.innerHTML = '';

    try {
        let messages = [];
        if (currentConversationType === 'user') {
            messages = await MessageAPI.getMessagesWithUser(currentConversationId);
        } else if (currentConversationType === 'group') {
            messages = await MessageAPI.getGroupMessages(currentConversationId);
        }

        messages.forEach(msg => displayMessage(msg));
    } catch (error) {
        console.error('Failed to load messages:', error);
    }
}

// ===== MODAL FUNCTIONS =====

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function toggleAuthForm() {
    if (window.loginForm) window.loginForm.classList.toggle('active');
    if (window.registerForm) window.registerForm.classList.toggle('active');
}

// ===== CONVERSATION MANAGEMENT =====

async function startNewConversation() {
    const userId = document.getElementById('selectUser').value;
    if (!userId) {
        showNotification('Please select a user', 'error');
        return;
    }

    const user = usersList.find(u => u.id == userId);
    if (user) {
        selectUser(user);
        closeModal('newChatModal');
    }
}

async function createGroup() {
    const name = document.getElementById('groupName').value.trim();
    const description = document.getElementById('groupDescription').value.trim();

    if (!name) {
        showNotification('Group name is required', 'error');
        return;
    }

    try {
        await GroupAPI.createGroup(name, description);
        showNotification('Group created successfully', 'success');
        loadGroups();
        closeModal('createGroupModal');
        document.getElementById('groupName').value = '';
        document.getElementById('groupDescription').value = '';
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// ===== CRM FUNCTIONS =====

function showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(el => {
        el.classList.remove('active');
    });
    document.getElementById(sectionName + 'Section').classList.add('active');

    if (sectionName === 'interactions') {
        loadInteractions();
    } else if (sectionName === 'opportunities') {
        loadOpportunities();
    }
}

async function loadInteractions() {
    try {
        const interactions = await InteractionAPI.getAllInteractions();
        renderInteractions(interactions);
    } catch (error) {
        console.error('Failed to load interactions:', error);
    }
}

async function loadOpportunities() {
    try {
        const opportunities = await OpportunityAPI.getAllOpportunities();
        renderOpportunities(opportunities);
    } catch (error) {
        console.error('Failed to load opportunities:', error);
    }
}

function renderInteractions(interactions) {
    const container = document.getElementById('interactionsList');
    container.innerHTML = '';

    interactions.forEach(interaction => {
        const card = document.createElement('div');
        card.className = 'interaction-card';
        card.innerHTML = `
            <div class="card-header">
                <h3>${escapeHtml(interaction.interactionType)}</h3>
            </div>
            <div class="card-body">
                <p><strong>Description:</strong> ${escapeHtml(interaction.description)}</p>
                <p><strong>Date:</strong> ${new Date(interaction.createdAt).toLocaleDateString()}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderOpportunities(opportunities) {
    const container = document.getElementById('opportunitiesList');
    container.innerHTML = '';

    opportunities.forEach(opp => {
        const card = document.createElement('div');
        card.className = 'opportunity-card';
        card.innerHTML = `
            <div class="card-header">
                <h3>${escapeHtml(opp.opportunityName)}</h3>
                <span style="background: #3498db; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${opp.stage}
                </span>
            </div>
            <div class="card-body">
                <p><strong>Value:</strong> $${opp.opportunityValue.toFixed(2)}</p>
                <p><strong>Probability:</strong> ${opp.probability}%</p>
                <p><strong>Expected Close:</strong> ${new Date(opp.expectedCloseDate).toLocaleDateString()}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

function showAddInteractionForm() {
    const description = prompt('Enter interaction details:');
    if (description) {
        const type = prompt('Interaction type (Call/Email/Meeting):');
        if (type) addInteraction(type, description);
    }
}

function showAddOpportunityForm() {
    const name = prompt('Opportunity name:');
    if (name) {
        const value = prompt('Opportunity value:');
        if (value) addOpportunity(name, value);
    }
}

async function addInteraction(type, description) {
    try {
        await InteractionAPI.createInteraction(currentConversationId, type, description);
        showNotification('Interaction added successfully', 'success');
        loadInteractions();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function addOpportunity(name, value) {
    try {
        await OpportunityAPI.createOpportunity(currentConversationId, name, value, 'NEW', 30);
        showNotification('Opportunity added successfully', 'success');
        loadOpportunities();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// ===== UTILITY FUNCTIONS =====

function showNotification(message, type = 'info') {
    if (!window.notification) {
        console.log(`Notification [${type}]: ${message}`);
        return;
    }
    
    window.notification.textContent = message;
    window.notification.className = `notification show ${type}`;
    setTimeout(() => {
        if (window.notification) {
            window.notification.classList.remove('show');
        }
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
