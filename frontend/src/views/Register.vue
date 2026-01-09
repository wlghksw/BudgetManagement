<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>회원가입</h1>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>이름</label>
          <input 
            v-model="name" 
            type="text" 
            required 
            placeholder="이름을 입력하세요"
          />
        </div>
        <div class="form-group">
          <label>이메일</label>
          <input 
            v-model="email" 
            type="email" 
            required 
            placeholder="이메일을 입력하세요"
          />
        </div>
        <div class="form-group">
          <label>비밀번호</label>
          <input 
            v-model="password" 
            type="password" 
            required 
            placeholder="비밀번호를 입력하세요"
            minlength="6"
          />
        </div>
        <div class="form-group">
          <label>통화</label>
          <select v-model="currency">
            <option value="KRW">원화 (KRW)</option>
            <option value="USD">달러 (USD)</option>
            <option value="EUR">유로 (EUR)</option>
            <option value="JPY">엔 (JPY)</option>
          </select>
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? '가입 중...' : '회원가입' }}
        </button>
      </form>
      <p class="auth-link">
        이미 계정이 있으신가요? <router-link to="/login">로그인</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const name = ref('');
const email = ref('');
const password = ref('');
const currency = ref('KRW');
const error = ref('');
const loading = ref(false);

const handleRegister = async () => {
  error.value = '';
  loading.value = true;
  
  const result = await authStore.register(
    email.value, 
    password.value, 
    name.value, 
    currency.value
  );
  
  if (result.success) {
    router.push('/');
  } else {
    error.value = result.error;
  }
  
  loading.value = false;
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  width: 100%;
  max-width: 400px;
}

.auth-card h1 {
  margin-bottom: 1.5rem;
  text-align: center;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #ef4444;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: #fee;
  border-radius: 6px;
  text-align: center;
}

.auth-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.auth-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.auth-link a:hover {
  text-decoration: underline;
}
</style>


