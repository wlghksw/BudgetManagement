<template>
  <div class="transactions-page">
    <div class="page-header">
      <h1>거래 내역</h1>
      <div class="header-actions">
        <button @click="showUploadModal = true" class="btn-secondary">📁 파일 업로드</button>
        <button @click="showAddModal = true" class="btn-primary">+ 거래 추가</button>
        <button 
          v-if="transactions.length > 0"
          @click="deleteAllTransactions" 
          class="btn-danger"
        >
          🗑️ 전체 삭제
        </button>
      </div>
    </div>

    <!-- 필터 -->
    <div class="filters">
      <select v-model="filters.type" @change="loadTransactions">
        <option value="">전체</option>
        <option value="income">수입</option>
        <option value="expense">지출</option>
      </select>
      <select v-model="filters.categoryId" @change="loadTransactions">
        <option value="">전체 카테고리</option>
        <option v-for="cat in categories" :key="cat._id" :value="cat._id">
          {{ cat.icon }} {{ cat.name }}
        </option>
      </select>
      <input 
        v-model="filters.startDate" 
        type="date" 
        @change="loadTransactions"
        placeholder="시작일"
      />
      <input 
        v-model="filters.endDate" 
        type="date" 
        @change="loadTransactions"
        placeholder="종료일"
      />
    </div>

    <!-- 거래 목록 -->
    <div class="transactions-list">
      <div 
        v-for="tx in transactions" 
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
        <div class="transaction-actions">
          <button @click="editTransaction(tx)" class="icon-btn">✏️</button>
          <button @click="deleteTransaction(tx._id)" class="icon-btn">🗑️</button>
        </div>
      </div>
    </div>

    <p v-if="transactions.length === 0" class="empty-state">거래 내역이 없습니다.</p>

    <!-- 모달 -->
    <TransactionModal 
      v-if="showAddModal || editingTx" 
      :transaction="editingTx"
      @close="closeModal"
      @saved="handleTransactionSaved"
    />

    <UploadModal 
      v-if="showUploadModal"
      @close="showUploadModal = false"
      @uploaded="handleTransactionSaved"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../utils/api';
import TransactionModal from '../components/TransactionModal.vue';
import UploadModal from '../components/UploadModal.vue';

const transactions = ref([]);
const categories = ref([]);
const showAddModal = ref(false);
const showUploadModal = ref(false);
const editingTx = ref(null);

const filters = ref({
  type: '',
  categoryId: '',
  startDate: '',
  endDate: ''
});

import { formatCurrency } from '../utils/currency';

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const loadTransactions = async () => {
  try {
    const params = new URLSearchParams();
    if (filters.value.type) params.append('type', filters.value.type);
    if (filters.value.categoryId) params.append('categoryId', filters.value.categoryId);
    if (filters.value.startDate) params.append('startDate', filters.value.startDate);
    if (filters.value.endDate) params.append('endDate', filters.value.endDate);

    const response = await api.get(`/transactions?${params.toString()}`);
    transactions.value = response.data.transactions;
  } catch (error) {
    console.error('거래 내역 로드 실패:', error);
  }
};

const loadCategories = async () => {
  try {
    const response = await api.get('/categories');
    categories.value = response.data;
  } catch (error) {
    console.error('카테고리 로드 실패:', error);
  }
};

const editTransaction = (tx) => {
  editingTx.value = tx;
};

const deleteTransaction = async (id) => {
  if (!confirm('정말 삭제하시겠습니까?')) return;

  try {
    await api.delete(`/transactions/${id}`);
    loadTransactions();
  } catch (error) {
    alert('삭제에 실패했습니다.');
  }
};

const deleteAllTransactions = async () => {
  const count = transactions.value.length;
  if (!confirm(`정말 모든 거래 내역(${count}건)을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

  try {
    await api.delete('/transactions/all');
    alert('모든 거래 내역이 삭제되었습니다.');
    loadTransactions();
  } catch (error) {
    alert('삭제에 실패했습니다: ' + (error.response?.data?.error || error.message));
  }
};

const closeModal = () => {
  showAddModal.value = false;
  editingTx.value = null;
};

const handleTransactionSaved = () => {
  loadTransactions();
  closeModal();
};

onMounted(() => {
  loadTransactions();
  loadCategories();
});
</script>

<style scoped>
.transactions-page {
  padding: 2rem 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filters select,
.filters input {
  padding: 0.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
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
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

.transaction-actions {
  display: flex;
  gap: 0.5rem;
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

.btn-secondary {
  background: #e0e0e0;
  color: #333;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-danger:hover {
  background: #dc2626;
}
</style>

