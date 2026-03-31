import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set up axios defaults
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Fetch user profile
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/user/profile');
      setUser(response.data.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    console.log('AuthContext login called with:', email);
    const response = await axios.post('/user/login', { email, password });
    console.log('Login response:', response.data);
    const { accessToken, refreshToken } = response.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    await fetchProfile();
    return response.data;
  };

  const signup = async (userData) => {
    const response = await axios.post('/user/signup', userData);
    return response.data;
  };

  const verifyEmail = async (email, otp) => {
    const response = await axios.post('/user/verify-email-otb', { email, otp });
    return response.data;
  };

  const logout = async (flag = false) => {
    try {
      await axios.post('/user/logout', { flag });
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const rotateTokens = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');
    const response = await axios.post('/user/rotate-tokens', {}, {
      headers: { Authorization: `Bearer ${refreshToken}` }
    });
    const { accessToken, refreshToken: newRefresh } = response.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', newRefresh);
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    return response.data;
  };

  const requestForgotPassword = async (email) => {
    const response = await axios.post('/user/forget-password-otp', { email });
    return response.data;
  };

  const verifyForgotPassword = async (email, otp) => {
    const response = await axios.patch('/user/varify-password-otp', { email, otp });
    return response.data;
  };

  const resetForgotPassword = async (email, otp, password, confirmPassword) => {
    const response = await axios.patch('/user/reset-forgot-password', { email, otp, password, confirmPassword });
    return response.data;
  };

  const value = {
    user,
    login,
    signup,
    verifyEmail,
    requestForgotPassword,
    verifyForgotPassword,
    resetForgotPassword,
    logout,
    rotateTokens,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};