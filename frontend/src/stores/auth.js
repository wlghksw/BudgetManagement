import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../utils/api';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null);
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

  const isAuthenticated = computed(() => !!token.value);

  const login = async (email, password) => {
    try {
      const response = await api.post('/users/login', { email, password });
      token.value = response.data.token;
      user.value = response.data.user;
      localStorage.setItem('token', token.value);
      localStorage.setItem('user', JSON.stringify(user.value));
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || '로그인에 실패했습니다.' 
      };
    }
  };

  const register = async (email, password, name, currency) => {
    try {
      const response = await api.post('/users/register', { 
        email, 
        password, 
        name, 
        currency 
      });
      token.value = response.data.token;
      user.value = response.data.user;
      localStorage.setItem('token', token.value);
      localStorage.setItem('user', JSON.stringify(user.value));
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || '회원가입에 실패했습니다.' 
      };
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  };

  // 초기화 시 토큰 설정
  if (token.value) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    register,
    logout
  };
});


