import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor to include token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const register = async (userData) => {
  try {
    console.log('Attempting registration with:', { username: userData.username });
    const response = await api.post('/auth/register', userData);
    console.log('Registration response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Registration error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

export const login = async (credentials) => {
  if (!credentials?.username || !credentials?.password) {
    throw new Error('Username and password are required');
  }

  try {
    console.log('Attempting login with:', { username: credentials.username });
    const response = await api.post('/auth/login', credentials);
    console.log('Login response:', response.data);
    
    if (!response.data || !response.data.token) {
      throw new Error('Invalid login response from server');
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const getProfile = async () => {
  try {
    const response = await api.get('/auth/profile');
    return response.data;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

// Intern Log APIs
export const timeIn = async (data) => {
  try {
    const response = await api.post('/intern-logs/time-in', data);
    return response.data;
  } catch (error) {
    console.error('Time in error:', error);
    throw error.response?.data || error;
  }
};

export const timeOut = async (data) => {
  try {
    const response = await api.post('/intern-logs/time-out', data);
    return response.data;
  } catch (error) {
    console.error('Time out error:', error);
    throw error.response?.data || error;
  }
};

export const getTodayLog = async (organizationId) => {
  try {
    // Only include organizationId in URL if it exists and is valid
    let url = '/intern-logs/today';
    if (organizationId) {
      url += `?organizationId=${organizationId}`;
    }
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Get today log error:', error);
    throw error.response?.data || error;
  }
};

export const getLogs = async (organizationId) => {
  try {
    // Only include organizationId in URL if it exists and is valid
    let url = '/intern-logs';
    if (organizationId) {
      url += `?organizationId=${organizationId}`;
    }
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Get logs error:', error);
    throw error.response?.data || error;
  }
};

export const updateLogDescription = async (logId, description) => {
  try {
    const response = await api.patch(`/intern-logs/${logId}/description`, { description });
    return response.data;
  } catch (error) {
    console.error('Update log description error:', error);
    throw error.response?.data || error;
  }
};

export const updateLog = async (logId, logData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/logs/${logId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(logData)
    });

    if (!response.ok) {
      throw new Error('Failed to update log');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating log:', error);
    throw error;
  }
};

export const deleteLog = async (logId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/logs/${logId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete log');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting log:', error);
    throw error;
  }
};

export const getMemberLogs = async () => {
  try {
    const response = await api.get('/organizations/member-logs');
    return response;
  } catch (error) {
    console.error('Get member logs error:', error);
    throw error;
  }
};

export default api;