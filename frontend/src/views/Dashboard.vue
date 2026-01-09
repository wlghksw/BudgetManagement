<template>
  <div class="dashboard">
    <!-- 헤더 -->
    <div class="dashboard-header">
    </div>
    <!-- 통계 카드 -->
    <div class="stats-grid">
      <div class="stat-card income">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <h3>총 수입</h3>
          <p class="stat-value">{{ formatCurrency(stats.totalIncome) }}</p>
        </div>
      </div>
      <div class="stat-card expense">
        <div class="stat-icon">💸</div>
        <div class="stat-content">
          <h3>총 지출</h3>
          <p class="stat-value">{{ formatCurrency(stats.totalExpense) }}</p>
        </div>
      </div>
    </div>

    <!-- 기간 필터 -->
    <div class="filter-section">
      <div class="period-filters">
        <button 
          v-for="period in periodOptions" 
          :key="period.value"
          @click="selectedPeriod = period.value; loadStats()"
          :class="{ active: selectedPeriod === period.value }"
          class="period-btn"
        >
          {{ period.label }}
        </button>
      </div>
    </div>

    <!-- 차트 섹션 -->
    <div class="charts-section">
      <div class="chart-card">
        <h2>카테고리별 지출 분석</h2>
        <div v-if="stats.categoryBreakdown.length > 0" class="chart-wrapper">
          <div class="chart-container">
            <DoughnutChart :data="chartData" />
          </div>
          <div class="category-list">
            <h3>지출 상세 내역</h3>
            <div class="category-items">
              <div 
                v-for="(category, index) in sortedCategories" 
                :key="category.categoryId"
                class="category-item"
                :class="{ 'top-spender': index === 0 }"
              >
                <div class="category-rank">{{ index + 1 }}</div>
                <div class="category-icon-small" :style="{ backgroundColor: category.color }">
                  {{ category.icon }}
                </div>
                <div class="category-details">
                  <div class="category-name-row">
                    <span class="category-name">{{ category.categoryName }}</span>
                    <span v-if="index === 0" class="top-badge">🔥 가장 많이 지출</span>
                  </div>
                  <div class="category-stats">
                    <span class="category-amount">{{ formatCurrency(category.total) }}</span>
                    <span class="category-percentage">{{ category.percentage }}%</span>
                    <span class="category-count">{{ category.count }}건</span>
                  </div>
                  <div class="category-progress">
                    <div 
                      class="progress-bar" 
                      :style="{ 
                        width: category.percentage + '%', 
                        backgroundColor: category.color 
                      }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="empty-state">지출 데이터가 없습니다.</p>
      </div>
    </div>

    <!-- 예산 대비 지출 현황 -->
    <div v-if="budgets.length > 0" class="budget-status-section">
      <div class="budget-status-card">
        <h2>예산 대비 지출 현황</h2>
        <div class="budget-status-list">
          <div 
            v-for="budget in budgets" 
            :key="budget._id"
            class="budget-status-item"
            :class="{ 
              'over-budget': budget.spent > budget.amount,
              'under-budget': budget.spent < budget.amount 
            }"
          >
            <div class="budget-status-header">
              <div class="budget-status-icon" :style="{ backgroundColor: budget.categoryId.color }">
                {{ budget.categoryId.icon }}
              </div>
              <div class="budget-status-info">
                <h3>{{ budget.categoryId.name }}</h3>
                <p class="budget-status-period">{{ currentYear }}년 {{ currentMonth }}월</p>
              </div>
            </div>
            <div class="budget-status-details">
              <div class="budget-status-row">
                <span class="label">예산:</span>
                <span class="amount">{{ formatCurrency(budget.amount) }}</span>
              </div>
              <div class="budget-status-row">
                <span class="label">실제 지출:</span>
                <span class="amount" :class="{ 'over': budget.spent > budget.amount }">
                  {{ formatCurrency(budget.spent) }}
                </span>
              </div>
              <div class="budget-status-row difference">
                <span class="label">차이:</span>
                <span 
                  class="amount difference-amount"
                  :class="{ 
                    'positive': budget.spent < budget.amount,
                    'negative': budget.spent > budget.amount 
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
              <div class="budget-status-progress">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ 
                      width: `${Math.min((budget.spent / budget.amount) * 100, 100)}%`,
                      backgroundColor: budget.spent > budget.amount ? '#ef4444' : '#10b981'
                    }"
                  ></div>
                </div>
                <span class="progress-text">
                  {{ Math.round((budget.spent / budget.amount) * 100) }}% 사용
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 지출 분석 요약 -->
    <div v-if="stats.categoryBreakdown.length > 0" class="analysis-section">
      <div class="analysis-card">
        <h2>💡 지출 분석</h2>
        <div class="analysis-content">
          <div class="analysis-item">
            <div class="analysis-label">가장 많이 지출한 카테고리</div>
            <div class="analysis-value highlight">
              {{ topCategory.categoryName }} 
              <span class="analysis-amount">{{ formatCurrency(topCategory.total) }}</span>
              <span class="analysis-percentage">({{ topCategory.percentage }}%)</span>
            </div>
          </div>
          <div class="analysis-item">
            <div class="analysis-label">평균 지출 (카테고리당)</div>
            <div class="analysis-value">
              {{ formatCurrency(averageCategorySpending) }}
            </div>
          </div>
          <div class="analysis-item">
            <div class="analysis-label">총 지출 카테고리 수</div>
            <div class="analysis-value">
              {{ stats.categoryBreakdown.length }}개
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 최근 거래 내역 -->
    <div class="recent-transactions">
      <h2>최근 거래 내역</h2>
      <div v-if="recentTransactions.length > 0" class="transactions-list">
        <div 
          v-for="tx in recentTransactions" 
          :key="tx._id" 
          class="transaction-item"
        >
          <div class="transaction-icon" :style="{ backgroundColor: tx.categoryId.color }">
            {{ tx.categoryId.icon }}
          </div>
          <div class="transaction-info">
            <h4>{{ tx.description || '거래 내역' }}</h4>
            <p class="transaction-meta">
              {{ tx.categoryId.name }} · {{ formatDate(tx.date) }}
            </p>
          </div>
          <div class="transaction-amount" :class="tx.type">
            {{ tx.type === 'income' ? '+' : '-' }}{{ formatCurrency(tx.amount) }}
          </div>
        </div>
      </div>
      <p v-else class="empty-state">거래 내역이 없습니다.</p>
    </div>

    <!-- 거래 추가 모달 -->
    <TransactionModal 
      v-if="showAddModal" 
      @close="showAddModal = false"
      @saved="handleTransactionSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../utils/api';
import DoughnutChart from '../components/DoughnutChart.vue';
import TransactionModal from '../components/TransactionModal.vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const userName = computed(() => authStore.user?.name || 'User');

const stats = ref({
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
  categoryBreakdown: []
});

const recentTransactions = ref([]);
const showAddModal = ref(false);
const selectedPeriod = ref('all');
const budgets = ref([]);
const currentMonth = ref(new Date().getMonth() + 1);
const currentYear = ref(new Date().getFullYear());

const periodOptions = [
  { label: '전체', value: 'all' },
  { label: '이번 달', value: 'month' },
  { label: '지난 달', value: 'lastMonth' },
  { label: '올해', value: 'year' }
];

const sortedCategories = computed(() => {
  return [...stats.value.categoryBreakdown].sort((a, b) => b.total - a.total);
});

const topCategory = computed(() => {
  return sortedCategories.value[0] || { categoryName: '-', total: 0, percentage: 0 };
});

const averageCategorySpending = computed(() => {
  if (stats.value.categoryBreakdown.length === 0) return 0;
  const sum = stats.value.categoryBreakdown.reduce((acc, cat) => acc + cat.total, 0);
  return Math.round(sum / stats.value.categoryBreakdown.length);
});

const chartData = computed(() => {
  return {
    labels: stats.value.categoryBreakdown.map(c => c.categoryName),
    datasets: [{
      data: stats.value.categoryBreakdown.map(c => c.total),
      backgroundColor: stats.value.categoryBreakdown.map(c => c.color)
    }]
  };
});

import { formatCurrency } from '../utils/currency';

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric'
  });
};

const loadStats = async () => {
  try {
    const today = new Date();
    let startDate = null;
    let endDate = null;

    if (selectedPeriod.value === 'month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (selectedPeriod.value === 'lastMonth') {
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (selectedPeriod.value === 'year') {
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear(), 11, 31);
    }

    let url = '/transactions/stats';
    if (startDate && endDate) {
      url += `?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`;
    }

    const response = await api.get(url);
    stats.value = response.data;
  } catch (error) {
    console.error('통계 로드 실패:', error);
  }
};

const loadRecentTransactions = async () => {
  try {
    const response = await api.get('/transactions?limit=10');
    recentTransactions.value = response.data.transactions;
  } catch (error) {
    console.error('거래 내역 로드 실패:', error);
  }
};

const loadBudgets = async () => {
  try {
    // 현재 달의 예산을 불러올 때 spent 값이 자동으로 업데이트됨
    console.log(`[Dashboard] 예산 로드 요청: ${currentYear.value}년 ${currentMonth.value}월`);
    const response = await api.get(`/budgets/month?month=${currentMonth.value}&year=${currentYear.value}`);
    budgets.value = response.data;
    console.log(`[Dashboard] 예산 로드 완료: ${currentYear.value}년 ${currentMonth.value}월 예산 ${budgets.value.length}개`);
    budgets.value.forEach(b => {
      console.log(`  - ${b.categoryId.name}: 예산 ${b.amount.toLocaleString()}원, 지출 ${b.spent.toLocaleString()}원 (${((b.spent / b.amount) * 100).toFixed(1)}%)`);
    });
  } catch (error) {
    console.error('[Dashboard] 예산 로드 실패:', error);
  }
};

const handleTransactionSaved = async () => {
  // 거래 내역이 저장되면 통계, 최근 거래, 예산을 모두 새로고침
  await Promise.all([
    loadStats(),
    loadRecentTransactions(),
    loadBudgets()
  ]);
  console.log('[거래 저장 완료] 모든 데이터 새로고침됨');
};

onMounted(() => {
  loadStats();
  loadRecentTransactions();
  loadBudgets();
});
</script>

<style scoped>
.dashboard {
  padding: 2rem 0;
  animation: fadeIn 0.5s ease-in;
  position: relative;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dashboard-header {
  margin-bottom: 1.5rem;
}

.dashboard-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.balance-card {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  color: white;
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
}

.balance-header {
  margin-bottom: 1rem;
}

.balance-label {
  font-size: 0.875rem;
  opacity: 0.9;
  font-weight: 500;
}

.balance-amount {
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
  border: 1px solid #f3f4f6;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-card.income {
  border-left: 4px solid #10b981;
}

.stat-card.expense {
  border-left: 4px solid #ef4444;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  transition: all 0.2s ease;
}

.stat-card.income .stat-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-card.expense .stat-icon {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.stat-card:hover .stat-icon {
  transform: scale(1.05);
}

.stat-content h3 {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  letter-spacing: -0.5px;
}

.filter-section {
  margin-bottom: 1.5rem;
}

.period-filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.period-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.period-btn:hover {
  border-color: #10b981;
  color: #10b981;
}

.period-btn.active {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.charts-section {
  margin-bottom: 2rem;
}

.chart-card {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f3f4f6;
  transition: all 0.2s ease;
}

.chart-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.chart-card h2 {
  margin-bottom: 1.5rem;
  color: #1f2937;
  font-weight: 700;
  font-size: 1.25rem;
}

.chart-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.chart-container {
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.category-list {
  display: flex;
  flex-direction: column;
}

.category-list h3 {
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.1rem;
}

.category-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 300px;
  overflow-y: auto;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  background: #f9fafb;
  transition: all 0.2s;
}

.category-item:hover {
  background: #f3f4f6;
}

.category-item.top-spender {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
  border: 2px solid #ef4444;
}

.category-rank {
  font-weight: bold;
  color: #10b981;
  min-width: 24px;
  text-align: center;
}

.category-icon-small {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.category-icon-small::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
}

.category-item:hover .category-icon-small {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.category-item:hover .category-icon-small::before {
  opacity: 1;
}

.category-details {
  flex: 1;
}

.category-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.category-name {
  font-weight: 600;
  color: #333;
}

.top-badge {
  background: #ef4444;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.category-stats {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.category-amount {
  font-weight: 600;
  color: #333;
}

.category-percentage {
  color: #10b981;
  font-weight: 600;
}

.category-count {
  color: #666;
}

.category-progress {
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  transition: width 0.3s;
}

.budget-status-section {
  margin-bottom: 2rem;
}

.budget-status-card {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f3f4f6;
}

.budget-status-card h2 {
  margin-bottom: 1.5rem;
  color: #1f2937;
  font-weight: 700;
  font-size: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-status-card h2::after {
  content: 'See all';
  font-size: 0.875rem;
  font-weight: 500;
  color: #10b981;
  cursor: pointer;
}

.budget-status-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.budget-status-item {
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #f3f4f6;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.budget-status-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.budget-status-item.over-budget {
  border-color: #ef4444;
  background: #fef2f2;
}

.budget-status-item.under-budget {
  border-color: #10b981;
  background: #f0fdf4;
}

.budget-status-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.budget-status-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.budget-status-icon::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
}

.budget-status-item:hover .budget-status-icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.budget-status-item:hover .budget-status-icon::before {
  opacity: 1;
}

.budget-status-info h3 {
  margin-bottom: 0.25rem;
  color: #0f172a;
  font-size: 1.1rem;
  font-weight: 600;
}

.budget-status-period {
  font-size: 0.875rem;
  color: #64748b;
}

.budget-status-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.budget-status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.budget-status-row.difference {
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
  font-weight: 600;
}

.budget-status-row .label {
  color: #666;
  font-size: 0.875rem;
}

.budget-status-row .amount {
  font-weight: 600;
  color: #333;
}

.budget-status-row .amount.over {
  color: #ef4444;
}

.difference-amount.positive {
  color: #10b981;
}

.difference-amount.negative {
  color: #ef4444;
}

.budget-status-progress {
  margin-top: 0.5rem;
}

.budget-status-progress .progress-bar {
  width: 100%;
  height: 6px;
  background-color: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.budget-status-progress .progress-fill {
  height: 100%;
  transition: width 0.3s;
}

.budget-status-progress .progress-text {
  font-size: 0.75rem;
  color: #666;
  text-align: right;
  display: block;
}

.analysis-section {
  margin-bottom: 2rem;
}

.analysis-card {
  background: #ffffff;
  padding: 1.75rem;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1);
  border: 1px solid #f1f5f9;
}

.analysis-card h2 {
  margin-bottom: 1rem;
  color: #0f172a;
  font-weight: 700;
  font-size: 1.25rem;
}

.analysis-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.analysis-item {
  padding: 1rem;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.analysis-label {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.analysis-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.analysis-value.highlight {
  color: #ef4444;
}

.analysis-amount {
  display: block;
  font-size: 1.5rem;
  margin-top: 0.25rem;
}

.analysis-percentage {
  font-size: 0.875rem;
  color: #666;
  margin-left: 0.5rem;
}

@media (max-width: 768px) {
  .chart-wrapper {
    grid-template-columns: 1fr;
  }
  
  .category-items {
    max-height: 400px;
  }
}

.recent-transactions {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f3f4f6;
}

.recent-transactions h2 {
  margin-bottom: 1.5rem;
  color: #1f2937;
  font-weight: 700;
  font-size: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recent-transactions h2::after {
  content: 'See all';
  font-size: 0.875rem;
  font-weight: 500;
  color: #10b981;
  cursor: pointer;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  background: #ffffff;
  transition: all 0.2s ease;
  border: 1px solid #f3f4f6;
  margin-bottom: 0.5rem;
}

.transaction-item:hover {
  background: #f9fafb;
  border-color: #e5e7eb;
}

.transaction-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.transaction-info {
  flex: 1;
}

.transaction-info h4 {
  margin-bottom: 0.25rem;
  color: #0f172a;
  font-weight: 600;
}

.transaction-meta {
  font-size: 0.875rem;
  color: #64748b;
}

.transaction-amount {
  font-size: 1.25rem;
  font-weight: bold;
}

.transaction-amount.income {
  color: #10b981;
}

.transaction-amount.expense {
  color: #ef4444;
}

.empty-state {
  text-align: center;
  color: #999;
  padding: 2rem;
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

