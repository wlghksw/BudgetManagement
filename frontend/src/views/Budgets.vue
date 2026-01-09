<template>
  <div class="budgets-page">
    <div class="page-header">
      <h1>예산 관리</h1>
      <button @click="showAddModal = true" class="btn-primary">+ 예산 설정</button>
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
            <span class="remaining">
              남은 금액: {{ formatCurrency(budget.amount - budget.spent) }}
            </span>
          </div>
        </div>
        <div class="budget-actions">
          <button @click="editBudget(budget)" class="icon-btn">✏️</button>
          <button @click="deleteBudget(budget._id)" class="icon-btn">🗑️</button>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../utils/api';
import BudgetModal from '../components/BudgetModal.vue';

const budgets = ref([]);
const showAddModal = ref(false);
const editingBudget = ref(null);
const selectedMonth = ref(new Date().getMonth() + 1);
const selectedYear = ref(new Date().getFullYear());

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
    const response = await api.get(`/budgets/month?month=${selectedMonth.value}&year=${selectedYear.value}`);
    budgets.value = response.data;
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

onMounted(() => {
  loadBudgets();
});
</script>

<style scoped>
.budgets-page {
  padding: 2rem 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.month-selector {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.month-selector select {
  padding: 0.5rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
}

.budgets-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.budget-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
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
  color: #10b981;
  font-weight: 600;
}

.budget-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.icon-btn:hover {
  background-color: #f3f4f6;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 3rem;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
</style>

