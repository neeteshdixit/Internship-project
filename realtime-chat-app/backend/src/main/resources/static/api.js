/**
 * API Service - Handles all backend communication
 */

const API_BASE_URL = '/api';
let authToken = localStorage.getItem('authToken') || null;

// ===== AUTHENTICATION APIs =====

const AuthAPI = {
    /**
     * Register a new user
     */
    register: async (username, email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Registration failed');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    },

    /**
     * Login user
     */
    login: async (username, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }

            const data = await response.json();
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', username);
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    /**
     * Logout user
     */
    logout: () => {
        authToken = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }
};

// ===== USER APIs =====

const UserAPI = {
    /**
     * Get all users
     */
    getAllUsers: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch users');
            return await response.json();
        } catch (error) {
            console.error('GetAllUsers error:', error);
            return [];
        }
    },

    /**
     * Get current user profile
     */
    getCurrentUser: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch profile');
            return await response.json();
        } catch (error) {
            console.error('GetCurrentUser error:', error);
            return null;
        }
    },

    /**
     * Get user by ID
     */
    getUserById: async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch user');
            return await response.json();
        } catch (error) {
            console.error('GetUserById error:', error);
            return null;
        }
    },

    /**
     * Update user status
     */
    updateStatus: async (status) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/status`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status })
            });

            if (!response.ok) throw new Error('Failed to update status');
            return await response.json();
        } catch (error) {
            console.error('UpdateStatus error:', error);
            throw error;
        }
    }
};

// ===== MESSAGE APIs =====

const MessageAPI = {
    /**
     * Send a message
     */
    sendMessage: async (senderId, receiverId, groupId, content, messageType = 'TEXT') => {
        try {
            const response = await fetch(`${API_BASE_URL}/messages/send`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    senderId,
                    receiverId,
                    groupId,
                    content,
                    messageType
                })
            });

            if (!response.ok) throw new Error('Failed to send message');
            return await response.json();
        } catch (error) {
            console.error('SendMessage error:', error);
            throw error;
        }
    },

    /**
     * Get messages with user
     */
    getMessagesWithUser: async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/messages/user/${userId}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch messages');
            return await response.json();
        } catch (error) {
            console.error('GetMessagesWithUser error:', error);
            return [];
        }
    },

    /**
     * Get group messages
     */
    getGroupMessages: async (groupId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/messages/group/${groupId}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch messages');
            return await response.json();
        } catch (error) {
            console.error('GetGroupMessages error:', error);
            return [];
        }
    },

    /**
     * Mark message as read
     */
    markAsRead: async (messageId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/messages/${messageId}/read`, {
                method: 'PUT',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to mark as read');
            return await response.json();
        } catch (error) {
            console.error('MarkAsRead error:', error);
        }
    }
};

// ===== GROUP APIs =====

const GroupAPI = {
    /**
     * Create a new group
     */
    createGroup: async (name, description) => {
        try {
            const response = await fetch(`${API_BASE_URL}/groups/create`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ name, description })
            });

            if (!response.ok) throw new Error('Failed to create group');
            return await response.json();
        } catch (error) {
            console.error('CreateGroup error:', error);
            throw error;
        }
    },

    /**
     * Get all groups
     */
    getAllGroups: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/groups/`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch groups');
            return await response.json();
        } catch (error) {
            console.error('GetAllGroups error:', error);
            return [];
        }
    },

    /**
     * Join group
     */
    joinGroup: async (groupId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/groups/${groupId}/join`, {
                method: 'POST',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to join group');
            return await response.json();
        } catch (error) {
            console.error('JoinGroup error:', error);
            throw error;
        }
    }
};

// ===== CRM - INTERACTIONS APIs =====

const InteractionAPI = {
    /**
     * Create interaction
     */
    createInteraction: async (customerId, interactionType, description) => {
        try {
            const response = await fetch(`${API_BASE_URL}/interactions/create`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    customerId,
                    interactionType,
                    description
                })
            });

            if (!response.ok) throw new Error('Failed to create interaction');
            return await response.json();
        } catch (error) {
            console.error('CreateInteraction error:', error);
            throw error;
        }
    },

    /**
     * Get all interactions
     */
    getAllInteractions: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/interactions/`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch interactions');
            return await response.json();
        } catch (error) {
            console.error('GetAllInteractions error:', error);
            return [];
        }
    },

    /**
     * Get interactions for customer
     */
    getCustomerInteractions: async (customerId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/interactions/customer/${customerId}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch interactions');
            return await response.json();
        } catch (error) {
            console.error('GetCustomerInteractions error:', error);
            return [];
        }
    }
};

// ===== CRM - OPPORTUNITIES APIs =====

const OpportunityAPI = {
    /**
     * Create opportunity
     */
    createOpportunity: async (customerId, opportunityName, opportunityValue, stage, probability) => {
        try {
            const response = await fetch(`${API_BASE_URL}/opportunities/create`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    customerId,
                    opportunityName,
                    opportunityValue,
                    stage,
                    probability
                })
            });

            if (!response.ok) throw new Error('Failed to create opportunity');
            return await response.json();
        } catch (error) {
            console.error('CreateOpportunity error:', error);
            throw error;
        }
    },

    /**
     * Get all opportunities
     */
    getAllOpportunities: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/opportunities/`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (!response.ok) throw new Error('Failed to fetch opportunities');
            return await response.json();
        } catch (error) {
            console.error('GetAllOpportunities error:', error);
            return [];
        }
    },

    /**
     * Update opportunity stage
     */
    updateStage: async (opportunityId, stage) => {
        try {
            const response = await fetch(`${API_BASE_URL}/opportunities/${opportunityId}/stage`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ stage })
            });

            if (!response.ok) throw new Error('Failed to update stage');
            return await response.json();
        } catch (error) {
            console.error('UpdateStage error:', error);
            throw error;
        }
    }
};

// ===== HELPER FUNCTIONS =====

/**
 * Get authorization headers with JWT token
 */
function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    return headers;
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return authToken !== null;
}

/**
 * Get current auth token
 */
function getAuthToken() {
    return authToken;
}

/**
 * Set auth token
 */
function setAuthToken(token) {
    authToken = token;
    if (token) {
        localStorage.setItem('authToken', token);
    } else {
        localStorage.removeItem('authToken');
    }
}
