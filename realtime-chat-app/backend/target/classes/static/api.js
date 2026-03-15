/**
 * API Service - Handles backend communication with JWT auth.
 */

const API_BASE_URL = '/api';
let authToken = localStorage.getItem('authToken') || null;

function getStoredUser() {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

function setStoredUser(user) {
    if (!user) {
        localStorage.removeItem('currentUser');
        return;
    }
    localStorage.setItem('currentUser', JSON.stringify(user));
}

async function request(path, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers
    });

    const contentType = response.headers.get('content-type') || '';
    const hasJson = contentType.includes('application/json');
    const data = hasJson ? await response.json() : null;

    if (!response.ok) {
        const message = data && data.message ? data.message : `Request failed (${response.status})`;
        throw new Error(message);
    }

    return data;
}

const AuthAPI = {
    register: async (username, email, password) => {
        const data = await request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
        authToken = data.token;
        localStorage.setItem('authToken', authToken);
        setStoredUser(data.user);
        return data;
    },

    login: async (username, password) => {
        const data = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        authToken = data.token;
        localStorage.setItem('authToken', authToken);
        setStoredUser(data.user);
        return data;
    },

    getCurrentUser: async () => {
        return request('/auth/me', { method: 'GET' });
    },

    logout: () => {
        authToken = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    },

    getStoredUser
};

const UserAPI = {
    getAllUsers: async () => {
        return request('/users/active', { method: 'GET' });
    },

    getCurrentUser: async () => {
        return request('/users/profile', { method: 'GET' });
    },

    getUserById: async (userId) => {
        return request(`/users/${userId}`, { method: 'GET' });
    },

    updateOnlineStatus: async (userId, online) => {
        return request(`/users/${userId}/online?online=${encodeURIComponent(online)}`, {
            method: 'POST'
        });
    }
};

const MessageAPI = {
    sendPrivateMessage: async (receiverId, content) => {
        return request(`/messages/private/send?receiverId=${encodeURIComponent(receiverId)}`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    },

    getMessagesWithUser: async (userId, page = 0, size = 100) => {
        const data = await request(`/messages/private/${userId}?page=${page}&size=${size}`, {
            method: 'GET'
        });
        return data && data.content ? data.content : [];
    },

    getGroupMessages: async (groupId) => {
        return request(`/messages/group/${groupId}`, { method: 'GET' });
    },

    markAsRead: async (messageId) => {
        return request(`/messages/${messageId}/read`, { method: 'PUT' });
    }
};

const GroupAPI = {
    createGroup: async (name, description) => {
        return request('/groups', {
            method: 'POST',
            body: JSON.stringify({ name, description })
        });
    },

    getMyGroups: async () => {
        return request('/groups/user/my-groups', { method: 'GET' });
    },

    getAllGroups: async () => {
        return request('/groups/all-active', { method: 'GET' });
    },

    joinGroup: async (groupId, userId) => {
        return request(`/groups/${groupId}/members/${userId}`, {
            method: 'POST'
        });
    }
};

const InteractionAPI = {
    createInteraction: async (customerId, userId, type, notes) => {
        return request('/interactions', {
            method: 'POST',
            body: JSON.stringify({ customerId, userId, type, notes })
        });
    },

    getUserInteractions: async (userId) => {
        return request(`/interactions/user/${userId}`, { method: 'GET' });
    },

    getCustomerInteractions: async (customerId) => {
        return request(`/interactions/customer/${customerId}`, { method: 'GET' });
    }
};

const OpportunityAPI = {
    createOpportunity: async (customerId, ownerId, title, value, expectedCloseDate) => {
        return request('/opportunities', {
            method: 'POST',
            body: JSON.stringify({
                customerId,
                ownerId,
                title,
                value,
                expectedCloseDate
            })
        });
    },

    getOwnerOpportunities: async (ownerId) => {
        return request(`/opportunities/owner/${ownerId}`, { method: 'GET' });
    },

    updateStage: async (opportunityId, stage, probability) => {
        return request(
            `/opportunities/${opportunityId}/stage?stage=${encodeURIComponent(stage)}&probability=${encodeURIComponent(probability)}`,
            { method: 'PUT' }
        );
    }
};

function isAuthenticated() {
    return authToken !== null;
}

function getAuthToken() {
    return authToken;
}

function setAuthToken(token) {
    authToken = token;
    if (token) {
        localStorage.setItem('authToken', token);
    } else {
        localStorage.removeItem('authToken');
    }
}
