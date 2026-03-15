/**
 * Chat Application - Frontend Logic
 */

let stompClient = null;
let currentUser = AuthAPI.getStoredUser();
let currentConversationId = null;
let currentConversationType = null;
let usersList = [];
let groupsList = [];

document.addEventListener('DOMContentLoaded', function () {
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
    const startCallBtn = document.getElementById('startCallBtn');
    const startAudioBtn = document.getElementById('startAudioBtn');

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

    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    const createGroupBtn = document.getElementById('createGroupBtn');
    const startConvBtn = document.getElementById('startConvBtn');
    const createGroupSubmitBtn = document.getElementById('createGroupSubmitBtn');
    const addInteractionBtn = document.getElementById('addInteractionBtn');
    const addOpportunityBtn = document.getElementById('addOpportunityBtn');

    if (loginBtn) loginBtn.addEventListener('click', handleLogin);
    if (registerBtn) registerBtn.addEventListener('click', handleRegister);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (newChatBtn) newChatBtn.addEventListener('click', () => openModal('newChatModal'));
    if (createGroupBtn) createGroupBtn.addEventListener('click', () => openModal('createGroupModal'));
    if (startConvBtn) startConvBtn.addEventListener('click', startNewConversation);
    if (createGroupSubmitBtn) createGroupSubmitBtn.addEventListener('click', createGroup);
    if (addInteractionBtn) addInteractionBtn.addEventListener('click', showAddInteractionForm);
    if (addOpportunityBtn) addOpportunityBtn.addEventListener('click', showAddOpportunityForm);
    if (startCallBtn) startCallBtn.addEventListener('click', startVideoCall);
    if (startAudioBtn) startAudioBtn.addEventListener('click', startVideoCall);

    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    if (isAuthenticated() && currentUser) {
        initializeApp();
    } else {
        if (window.authModal) window.authModal.classList.add('active');
        if (window.chatApp) window.chatApp.style.display = 'none';
    }
});

async function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorEl = document.getElementById('loginError');

    if (!username || !password) {
        errorEl.textContent = 'Please enter username and password';
        return;
    }

    try {
        const authResult = await AuthAPI.login(username, password);
        currentUser = authResult.user;
        errorEl.textContent = '';
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
        const authResult = await AuthAPI.register(username, email, password);
        currentUser = authResult.user;
        errorEl.textContent = '';
        showNotification('Registration successful', 'success');
        initializeApp();
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
    usersList = [];
    groupsList = [];
    currentConversationId = null;
    currentConversationType = null;
    if (window.authModal) window.authModal.classList.add('active');
    if (window.chatApp) window.chatApp.style.display = 'none';
    const loginUsername = document.getElementById('loginUsername');
    const loginPassword = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginError');
    if (loginUsername) loginUsername.value = '';
    if (loginPassword) loginPassword.value = '';
    if (loginError) loginError.textContent = '';
    showNotification('Logged out successfully', 'success');
}

function initializeApp() {
    if (!currentUser) {
        completeLogout();
        return;
    }

    if (window.authModal) window.authModal.classList.remove('active');
    if (window.chatApp) window.chatApp.style.display = 'flex';
    if (window.currentUserEl) window.currentUserEl.textContent = currentUser.username;

    connectWebSocket();
    loadUsers();
    loadGroups();
    UserAPI.updateOnlineStatus(currentUser.id, true).catch(() => {});
}

function connectWebSocket() {
    const socket = new SockJS('/ws/chat');
    stompClient = Stomp.over(socket);

    stompClient.connect(
        { Authorization: `Bearer ${getAuthToken()}` },
        () => {
            if (window.userStatusEl) {
                window.userStatusEl.textContent = 'Online';
                window.userStatusEl.style.background = '#27ae60';
            }

            stompClient.subscribe(`/chat/private/${currentUser.id}`, (message) => {
                handleIncomingMessage(JSON.parse(message.body));
            });

            stompClient.subscribe('/group/broadcast', (message) => {
                handleGroupMessage(JSON.parse(message.body));
            });

            stompClient.subscribe('/call/signal', (message) => {
                const payload = JSON.parse(message.body);
                if (window.CallModule && typeof window.CallModule.handleSignal === 'function') {
                    window.CallModule.handleSignal(payload);
                }
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

async function sendMessage() {
    if (!window.messageInput) return;

    const content = window.messageInput.value.trim();
    if (!content || !currentConversationId) {
        showNotification('Select a conversation first', 'error');
        return;
    }

    try {
        if (currentConversationType === 'user') {
            const sentMessage = await MessageAPI.sendPrivateMessage(currentConversationId, content);
            displayMessage(sentMessage);
        } else if (currentConversationType === 'group') {
            if (stompClient && stompClient.connected) {
                stompClient.send('/app/group/send', {}, JSON.stringify({
                    sender: { id: currentUser.id, username: currentUser.username },
                    group: { id: currentConversationId },
                    content
                }));
            } else {
                showNotification('WebSocket disconnected', 'error');
                return;
            }
        }
        window.messageInput.value = '';
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function handleIncomingMessage(message) {
    const senderId = message.sender ? message.sender.id : message.senderId;
    const receiverId = message.receiver ? message.receiver.id : message.receiverId;

    const isCurrentChat =
        currentConversationType === 'user' &&
        ((senderId === currentConversationId && receiverId === currentUser.id) ||
         (senderId === currentUser.id && receiverId === currentConversationId));

    if (isCurrentChat) {
        displayMessage(message);
    } else {
        showNotification('New message received', 'info');
    }
}

function handleGroupMessage(message) {
    const groupId = message.group ? message.group.id : message.groupId;
    if (currentConversationType === 'group' && groupId === currentConversationId) {
        displayMessage(message);
    }
}

function displayMessage(message) {
    if (!window.messagesList) return;

    const senderId = message.sender ? message.sender.id : message.senderId;
    const senderName = message.sender ? message.sender.username : (message.senderUsername || 'Unknown');
    const timestamp = message.sentAt || message.createdAt || new Date().toISOString();

    const messageEl = document.createElement('li');
    messageEl.className = `message ${senderId === currentUser.id ? 'own' : 'other'}`;

    const time = new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageEl.innerHTML = `
        <div class="message-bubble">
            <div class="message-sender">${escapeHtml(senderName)}</div>
            ${escapeHtml(message.content || '')}
            <div class="message-time">${time}</div>
        </div>
    `;

    window.messagesList.appendChild(messageEl);
    if (window.messagesList.parentElement) {
        window.messagesList.parentElement.scrollTop = window.messagesList.parentElement.scrollHeight;
    }
}

async function loadUsers() {
    try {
        usersList = await UserAPI.getAllUsers();
        usersList = usersList.filter((user) => user.id !== currentUser.id);
        renderUsersList();
        renderUserSelect();
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

async function loadGroups() {
    try {
        groupsList = await GroupAPI.getMyGroups();
        renderGroupsList();
    } catch (error) {
        console.error('Failed to load groups:', error);
    }
}

function renderUsersList() {
    const usersContainer = document.getElementById('usersList');
    if (!usersContainer) return;
    usersContainer.innerHTML = '';

    usersList.forEach((user) => {
        const userEl = document.createElement('div');
        userEl.className = 'user-item';
        userEl.innerHTML = `
            <div class="user-avatar">${escapeHtml(user.username[0].toUpperCase())}</div>
            <span>${escapeHtml(user.username)}</span>
            <div class="user-status-indicator ${user.online ? '' : 'offline'}"></div>
        `;
        userEl.addEventListener('click', () => selectUser(user));
        usersContainer.appendChild(userEl);
    });
}

function renderUserSelect() {
    const selectUser = document.getElementById('selectUser');
    if (!selectUser) return;

    selectUser.innerHTML = '<option value="">Choose a user...</option>';
    usersList.forEach((user) => {
        const option = document.createElement('option');
        option.value = String(user.id);
        option.textContent = user.username;
        selectUser.appendChild(option);
    });
}

function renderGroupsList() {
    const groupsContainer = document.getElementById('groupsList');
    if (!groupsContainer) return;
    groupsContainer.innerHTML = '';

    groupsList.forEach((group) => {
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
    const chatTitle = document.getElementById('chatTitle');
    if (chatTitle) chatTitle.textContent = user.username;
    loadConversationMessages();
}

function selectGroup(group) {
    currentConversationId = group.id;
    currentConversationType = 'group';
    const chatTitle = document.getElementById('chatTitle');
    if (chatTitle) chatTitle.textContent = group.name;
    loadConversationMessages();
}

async function loadConversationMessages() {
    if (!window.messagesList) return;
    window.messagesList.innerHTML = '';

    try {
        let messages = [];
        if (currentConversationType === 'user') {
            messages = await MessageAPI.getMessagesWithUser(currentConversationId);
        } else if (currentConversationType === 'group') {
            messages = await MessageAPI.getGroupMessages(currentConversationId);
        }

        messages.forEach((message) => displayMessage(message));
    } catch (error) {
        console.error('Failed to load conversation messages:', error);
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

function toggleAuthForm() {
    if (window.loginForm) window.loginForm.classList.toggle('active');
    if (window.registerForm) window.registerForm.classList.toggle('active');
}

async function startNewConversation() {
    const userId = document.getElementById('selectUser').value;
    if (!userId) {
        showNotification('Please select a user', 'error');
        return;
    }

    const user = usersList.find((u) => u.id === Number(userId));
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
        const group = await GroupAPI.createGroup(name, description);
        groupsList.unshift(group);
        renderGroupsList();
        closeModal('createGroupModal');
        document.getElementById('groupName').value = '';
        document.getElementById('groupDescription').value = '';
        showNotification('Group created', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach((el) => el.classList.remove('active'));
    const section = document.getElementById(`${sectionName}Section`);
    if (section) section.classList.add('active');

    if (sectionName === 'interactions') {
        loadInteractions();
    } else if (sectionName === 'opportunities') {
        loadOpportunities();
    }
}

async function loadInteractions() {
    try {
        const interactions = await InteractionAPI.getUserInteractions(currentUser.id);
        renderInteractions(interactions);
    } catch (error) {
        console.error('Failed to load interactions:', error);
    }
}

async function loadOpportunities() {
    try {
        const opportunities = await OpportunityAPI.getOwnerOpportunities(currentUser.id);
        renderOpportunities(opportunities);
    } catch (error) {
        console.error('Failed to load opportunities:', error);
    }
}

function renderInteractions(interactions) {
    const container = document.getElementById('interactionsList');
    if (!container) return;
    container.innerHTML = '';

    interactions.forEach((interaction) => {
        const card = document.createElement('div');
        card.className = 'interaction-card';
        card.innerHTML = `
            <div class="card-header">
                <h3>${escapeHtml(interaction.type || 'Interaction')}</h3>
            </div>
            <div class="card-body">
                <p><strong>Notes:</strong> ${escapeHtml(interaction.notes || '')}</p>
                <p><strong>Date:</strong> ${new Date(interaction.interactionDate || interaction.createdAt).toLocaleDateString()}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderOpportunities(opportunities) {
    const container = document.getElementById('opportunitiesList');
    if (!container) return;
    container.innerHTML = '';

    opportunities.forEach((opp) => {
        const value = typeof opp.value === 'number' ? opp.value : Number(opp.value || 0);
        const probability = opp.probability || 0;
        const card = document.createElement('div');
        card.className = 'opportunity-card';
        card.innerHTML = `
            <div class="card-header">
                <h3>${escapeHtml(opp.title || 'Opportunity')}</h3>
                <span style="background: #3498db; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${escapeHtml(opp.stage || 'NEW')}
                </span>
            </div>
            <div class="card-body">
                <p><strong>Value:</strong> $${value.toFixed(2)}</p>
                <p><strong>Probability:</strong> ${probability}%</p>
                <p><strong>Expected Close:</strong> ${opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString() : 'N/A'}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

function showAddInteractionForm() {
    if (currentConversationType !== 'user' || !currentConversationId) {
        showNotification('Open a user conversation first', 'error');
        return;
    }

    const notes = prompt('Enter interaction notes:');
    if (!notes) return;
    const type = prompt('Interaction type (CALL/EMAIL/MEETING/DEMO/NOTE):');
    if (!type) return;
    addInteraction(type, notes);
}

function showAddOpportunityForm() {
    if (currentConversationType !== 'user' || !currentConversationId) {
        showNotification('Open a user conversation first', 'error');
        return;
    }

    const title = prompt('Opportunity title:');
    if (!title) return;
    const value = prompt('Opportunity value:');
    if (!value) return;
    addOpportunity(title, value);
}

async function addInteraction(type, notes) {
    try {
        await InteractionAPI.createInteraction(currentConversationId, currentUser.id, type, notes);
        showNotification('Interaction added', 'success');
        loadInteractions();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function addOpportunity(title, value) {
    try {
        const expectedCloseDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19);
        await OpportunityAPI.createOpportunity(
            currentConversationId,
            currentUser.id,
            title,
            Number(value),
            expectedCloseDate
        );
        showNotification('Opportunity added', 'success');
        loadOpportunities();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function startVideoCall() {
    if (currentConversationType !== 'user' || !currentConversationId) {
        showNotification('Select a user conversation before starting a call', 'error');
        return;
    }

    if (typeof window.CallModule !== 'undefined' && window.CallModule.initiateCall) {
        showSection('call');
        window.CallModule.initiateCall(currentConversationId);
    } else {
        showNotification('Call module not available', 'error');
    }
}

function showNotification(message, type = 'info') {
    if (!window.notification) {
        console.log(`Notification [${type}]: ${message}`);
        return;
    }
    window.notification.textContent = message;
    window.notification.className = `notification show ${type}`;
    setTimeout(() => {
        if (window.notification) window.notification.classList.remove('show');
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.openModal = openModal;
window.closeModal = closeModal;
window.toggleAuthForm = toggleAuthForm;
window.showSection = showSection;
