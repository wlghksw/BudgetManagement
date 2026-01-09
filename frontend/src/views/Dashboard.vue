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

    <!-- 차트 섹션 -->
    <div class="charts-section">
      <div class="chart-card">
        <h2>카테고리별 지출</h2>
        <div v-if="stats.categoryBreakdown.length > 0" class="chart-container">
          <DoughnutChart :data="chartData" />
        </div>
        <p v-else class="empty-state">데이터가 없습니다.</p>
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
    const response = await api.get('/transactions/stats');
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
  margin-bottom: 1rem;
  color: #333;
}

.chart-container {
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
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

