<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>대시보드</h1>
      <button @click="showAddModal = true" class="btn-primary">+ 거래 추가</button>
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
      <div class="stat-card balance" :class="{ negative: stats.balance < 0 }">
        <div class="stat-icon">💵</div>
        <div class="stat-content">
          <h3>잔액</h3>
          <p class="stat-value">{{ formatCurrency(stats.balance) }}</p>
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
                    <span v-if="index === 0" class="top-badge">💰 가장 많이 지출</span>
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

const stats = ref({
  totalIncome: 0,
  totalExpense: 0,
  balance: 0,
  categoryBreakdown: []
});

const recentTransactions = ref([]);
const showAddModal = ref(false);
const selectedPeriod = ref('all');

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

const handleTransactionSaved = () => {
  loadStats();
  loadRecentTransactions();
};

onMounted(() => {
  loadStats();
  loadRecentTransactions();
});
</script>

<style scoped>
.dashboard {
  padding: 2rem 0;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  font-size: 2rem;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-card.income {
  border-left: 4px solid #10b981;
}

.stat-card.expense {
  border-left: 4px solid #ef4444;
}

.stat-card.balance {
  border-left: 4px solid #3b82f6;
}

.stat-card.balance.negative {
  border-left-color: #ef4444;
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-content h3 {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
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
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  color: #666;
  transition: all 0.2s;
}

.period-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.period-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.charts-section {
  margin-bottom: 2rem;
}

.chart-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.chart-card h2 {
  margin-bottom: 1.5rem;
  color: #333;
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
  color: #667eea;
  min-width: 24px;
  text-align: center;
}

.category-icon-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
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
  color: #667eea;
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

.analysis-section {
  margin-bottom: 2rem;
}

.analysis-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.analysis-card h2 {
  margin-bottom: 1rem;
  color: #333;
}

.analysis-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.analysis-item {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.analysis-label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.analysis-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
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
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.recent-transactions h2 {
  margin-bottom: 1rem;
  color: #333;
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
  border-radius: 8px;
  background-color: #f9fafb;
  transition: background-color 0.2s;
}

.transaction-item:hover {
  background-color: #f3f4f6;
}

.transaction-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.transaction-info {
  flex: 1;
}

.transaction-info h4 {
  margin-bottom: 0.25rem;
  color: #333;
}

.transaction-meta {
  font-size: 0.875rem;
  color: #666;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  opacity: 0.9;
}
</style>

