<template>
  <div class="budgets-page">
    <div class="page-header">
      <h1>예산 관리</h1>
      <div class="header-actions">
        <button @click="showSalaryModal = true" class="btn-secondary">월급 설정</button>
        <button @click="showAddModal = true" class="btn-primary">+ 예산 설정</button>
      </div>
    </div>

    <!-- 월급 기반 자동 분배 섹션 -->
    <div v-if="userSalary" class="salary-section">
      <div class="salary-card">
        <div class="salary-info">
          <h3>실수령액: {{ formatCurrency(userSalary) }}</h3>
          <p class="salary-hint">월급을 기준으로 자동으로 예산을 분배할 수 있습니다.</p>
        </div>
        <button @click="createBudgetsFromSalary" class="btn-auto-budget">
          월급 기반 자동 예산 생성
        </button>
      </div>
    </div>

    <!-- 월 선택 -->
    <div class="month-selector">
      <select v-model="selectedMonth" @change="loadBudgets">
        <option v-for="m in 12" :key="m" :value="m">{{ m }}월</option>
      </select>
      <select v-model="selectedYear" @change="loadBudgets">
        <option v-for="y in years" :key="y" :value="y">{{ y }}년</option>
      </select>
    </div>

    <!-- 예산 목록 -->
    <div class="budgets-list">
      <div 
        v-for="budget in budgets" 
        :key="budget._id" 
        class="budget-card"
      >
        <div class="budget-header">
          <div class="budget-icon" :style="{ backgroundColor: budget.categoryId.color }">
            {{ budget.categoryId.icon }}
          </div>
          <div class="budget-info">
            <h3>{{ budget.categoryId.name }}</h3>
            <p class="budget-period">{{ selectedYear }}년 {{ selectedMonth }}월</p>
          </div>
        </div>
        <div class="budget-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ 
                width: `${progressPercentage(budget)}%`,
                backgroundColor: getProgressColor(budget)
              }"
            ></div>
          </div>
          <div class="budget-amounts">
            <span class="spent">{{ formatCurrency(budget.spent) }}</span>
            <span class="total">/ {{ formatCurrency(budget.amount) }}</span>
            <span 
              class="remaining"
              :class="{ 
                'over-budget': budget.spent > budget.amount,
                'under-budget': budget.spent < budget.amount 
              }"
            >
              <span v-if="budget.spent < budget.amount">
                남은 금액: {{ formatCurrency(budget.amount - budget.spent) }}
              </span>
              <span v-else-if="budget.spent > budget.amount">
                초과: {{ formatCurrency(budget.spent - budget.amount) }}
              </span>
              <span v-else>
                예산 정확히 사용
              </span>
            </span>
          </div>
          <div class="budget-difference">
            <span class="difference-label">예산 대비:</span>
            <span 
              class="difference-value"
              :class="{ 
                'positive': budget.spent < budget.amount,
                'negative': budget.spent > budget.amount,
                'exact': budget.spent === budget.amount
              }"
            >
              <span v-if="budget.spent < budget.amount">
                {{ formatCurrency(budget.amount - budget.spent) }} 절약
              </span>
              <span v-else-if="budget.spent > budget.amount">
                {{ formatCurrency(budget.spent - budget.amount) }} 초과
              </span>
              <span v-else>
                예산 정확히 사용
              </span>
            </span>
          </div>
        </div>
        <div class="budget-actions">
          <button @click="editBudget(budget)" class="icon-btn">
            <i class="fas fa-edit"></i>
          </button>
          <button @click="deleteBudget(budget._id)" class="icon-btn">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <p v-if="budgets.length === 0" class="empty-state">설정된 예산이 없습니다.</p>

    <!-- 예산 설정 모달 -->
    <BudgetModal 
      v-if="showAddModal || editingBudget"
      :budget="editingBudget"
      :month="selectedMonth"
      :year="selectedYear"
      @close="closeModal"
      @saved="loadBudgets"
    />

    <!-- 월급 설정 모달 -->
    <SalaryModal
      v-if="showSalaryModal"
      @close="showSalaryModal = false"
      @saved="loadUserProfile"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../utils/api';
import BudgetModal from '../components/BudgetModal.vue';
import SalaryModal from '../components/SalaryModal.vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();

const budgets = ref([]);
const showAddModal = ref(false);
const showSalaryModal = ref(false);
const editingBudget = ref(null);
const selectedMonth = ref(new Date().getMonth() + 1);
const selectedYear = ref(new Date().getFullYear());
const userSalary = ref(null);

const years = ref([]);
for (let i = selectedYear.value - 2; i <= selectedYear.value + 2; i++) {
  years.value.push(i);
}

import { formatCurrency } from '../utils/currency';

const progressPercentage = (budget) => {
  if (budget.amount === 0) return 0;
  return Math.min((budget.spent / budget.amount) * 100, 100);
};

const getProgressColor = (budget) => {
  const percentage = progressPercentage(budget);
  if (percentage >= 100) return '#ef4444';
  if (percentage >= 80) return '#f59e0b';
  return '#10b981';
};

const loadBudgets = async () => {
  try {
    // 예산을 불러올 때 spent 값이 자동으로 업데이트됨 (백엔드에서 updateSpent 호출)
    const response = await api.get(`/budgets/month?month=${selectedMonth.value}&year=${selectedYear.value}`);
    budgets.value = response.data;
    console.log(`[예산 로드] ${selectedYear.value}년 ${selectedMonth.value}월 예산 ${budgets.value.length}개 로드됨`);
    // 각 예산의 spent 값 확인
    budgets.value.forEach(budget => {
      console.log(`  - ${budget.categoryId.name}: 예산 ${budget.amount.toLocaleString()}원, 지출 ${budget.spent.toLocaleString()}원`);
    });
  } catch (error) {
    console.error('예산 로드 실패:', error);
  }
};

const editBudget = (budget) => {
  editingBudget.value = budget;
};

const deleteBudget = async (id) => {
  if (!confirm('정말 삭제하시겠습니까?')) return;

  try {
    await api.delete(`/budgets/${id}`);
    loadBudgets();
  } catch (error) {
    alert('삭제에 실패했습니다.');
  }
};

const closeModal = () => {
  showAddModal.value = false;
  editingBudget.value = null;
};

const loadUserProfile = async () => {
  try {
    const response = await api.get('/users/profile');
    userSalary.value = response.data.salary || null;
    authStore.user = response.data;
  } catch (error) {
    console.error('프로필 로드 실패:', error);
  }
};

const createBudgetsFromSalary = async () => {
  if (!userSalary.value) {
    alert('먼저 월급을 설정해주세요.');
    showSalaryModal.value = true;
    return;
  }

  if (!confirm(`${selectedYear.value}년 ${selectedMonth.value}월 예산을 월급 기준으로 자동 생성하시겠습니까?`)) {
    return;
  }

  try {
    const response = await api.post('/budgets/from-salary', {
      month: selectedMonth.value,
      year: selectedYear.value
    });
    alert(response.data.message);
    loadBudgets();
  } catch (error) {
    alert(error.response?.data?.error || '예산 생성에 실패했습니다.');
    if (error.response?.data?.error?.includes('월급이 설정되지 않았습니다')) {
      showSalaryModal.value = true;
    }
  }
};

onMounted(() => {
  loadBudgets();
  loadUserProfile();
});
</script>

<style scoped>
.budgets-page {
  padding: 2rem 0;
  position: relative;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-secondary {
  background: #ffffff;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #10b981;
  color: #10b981;
}

.salary-section {
  margin-bottom: 2rem;
}

.salary-card {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  padding: 1.5rem;
  border-radius: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
}

.salary-info h3 {
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
}

.salary-hint {
  font-size: 0.875rem;
  opacity: 0.9;
}

.btn-auto-budget {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-auto-budget:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.month-selector {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.month-selector select {
  padding: 0.5rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
}

.budgets-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.budget-card {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f3f4f6;
  transition: all 0.2s ease;
}

.budget-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.budget-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.budget-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.budget-card:hover .budget-icon {
  transform: scale(1.05);
}

.budget-info h3 {
  margin-bottom: 0.25rem;
  color: #333;
}

.budget-period {
  font-size: 0.875rem;
  color: #666;
}

.budget-progress {
  margin-bottom: 1rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s;
}

.budget-amounts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.spent {
  font-weight: bold;
  color: #333;
}

.total {
  color: #666;
}

.remaining {
  font-weight: 600;
}

.remaining.under-budget {
  color: #10b981;
}

.remaining.over-budget {
  color: #ef4444;
}

.budget-difference {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.difference-label {
  font-size: 0.875rem;
  color: #666;
}

.difference-value {
  font-weight: 600;
  font-size: 1rem;
}

.difference-value.positive {
  color: #10b981;
}

.difference-value.negative {
  color: #ef4444;
}

.difference-value.exact {
  color: #666;
}

.budget-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.icon-btn {
  background: #f3f4f6;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.6rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.icon-btn:hover {
  background-color: #e5e7eb;
  color: #374151;
}

.icon-btn i {
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 3rem;
}

.btn-primary {
  background: #10b981;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.btn-primary:hover {
  background: #059669;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
}
</style>

