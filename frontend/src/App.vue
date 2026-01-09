<template>
  <div id="app">
    <nav v-if="isAuthenticated" class="navbar">
      <div class="nav-container">
        <router-link to="/" class="logo">예산 관리</router-link>
        <div class="nav-links">
          <router-link to="/" @click="handleNavClick">대시보드</router-link>
          <router-link to="/transactions" @click="handleNavClick">거래 내역</router-link>
          <router-link to="/budgets" @click="handleNavClick">예산 관리</router-link>
          <router-link to="/categories" @click="handleNavClick">카테고리</router-link>
          <button @click="handleLogout" class="logout-btn">로그아웃</button>
        </div>
      </div>
    </nav>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const handleNavClick = (event) => {
  // 네비게이션 클릭 이벤트 확인용 (디버깅)
  console.log('Navigation clicked:', event.target.textContent);
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #f5f7fa;
  color: #1e293b;
  min-height: 100vh;
  position: relative;
}

#app {
  min-height: 100vh;
}

.navbar {
  background: #ffffff;
  color: #1e293b;
  padding: 1rem 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid #e5e7eb;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: #10b981;
  text-decoration: none;
  transition: color 0.2s;
}

.logo:hover {
  color: #059669;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-links a {
  color: #6b7280;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  display: inline-block;
  position: relative;
  z-index: 1;
  font-weight: 500;
  font-size: 0.95rem;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: #10b981;
  background: #ecfdf5;
}

.nav-links a:active {
  transform: scale(0.98);
}

.logout-btn {
  background: #f3f4f6;
  border: none;
  color: #6b7280;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 2rem;
  position: relative;
  z-index: 1;
  background: transparent;
}

main > * {
  position: relative;
  z-index: 1;
}

@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 1rem;
  }
  
  .nav-links {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>


