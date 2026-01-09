<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ editingTransaction ? '거래 수정' : '거래 추가' }}</h2>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>유형</label>
          <select v-model="form.type" required>
            <option value="income">수입</option>
            <option value="expense">지출</option>
          </select>
        </div>
        <div class="form-group">
          <label>금액</label>
          <input 
            v-model.number="form.amount" 
            type="number" 
            required 
            min="0"
            placeholder="금액을 입력하세요"
          />
        </div>
        <div class="form-group">
          <label>카테고리</label>
          <select v-model="form.categoryId" required>
            <option value="">카테고리 선택</option>
            <option 
              v-for="cat in categories" 
              :key="cat._id" 
              :value="cat._id"
            >
              {{ cat.icon }} {{ cat.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>설명</label>
          <input 
            v-model="form.description" 
            type="text" 
            placeholder="거래 설명을 입력하세요"
          />
        </div>
        <div class="form-group">
          <label>날짜</label>
          <input 
            v-model="form.date" 
            type="date" 
            required
          />
        </div>
        <div v-if="error" class="error-message">{{ error }}</div>
        <div class="modal-actions">
          <button type="button" @click="$emit('close')" class="btn-secondary">취소</button>
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? '저장 중...' : '저장' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import api from '../utils/api';

const props = defineProps({
  transaction: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'saved']);

const form = ref({
  type: 'expense',
  amount: 0,
  categoryId: '',
  description: '',
  date: new Date().toISOString().split('T')[0]
});

const categories = ref([]);
const error = ref('');
const loading = ref(false);
const editingTransaction = ref(false);

const loadCategories = async () => {
  try {
    const response = await api.get(`/categories?type=${form.value.type}`);
    categories.value = response.data;
  } catch (err) {
    console.error('카테고리 로드 실패:', err);
  }
};

watch(() => form.value.type, () => {
  form.value.categoryId = '';
  loadCategories();
});

watch(() => props.transaction, (tx) => {
  if (tx) {
    editingTransaction.value = true;
    form.value = {
      type: tx.type,
      amount: tx.amount,
      categoryId: tx.categoryId._id || tx.categoryId,
      description: tx.description || '',
      date: new Date(tx.date).toISOString().split('T')[0]
    };
    loadCategories();
  }
}, { immediate: true });

const handleSubmit = async () => {
  error.value = '';
  loading.value = true;

  try {
    if (editingTransaction.value && props.transaction) {
      await api.put(`/transactions/${props.transaction._id}`, form.value);
    } else {
      await api.post('/transactions', form.value);
    }
    emit('saved');
    emit('close');
  } catch (err) {
    error.value = err.response?.data?.error || '저장에 실패했습니다.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadCategories();
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 2rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
  line-height: 1;
}

.close-btn:hover {
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

.error-message {
  color: #ef4444;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: #fee;
  border-radius: 6px;
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
  border: none;
}

.btn-secondary:hover {
  background: #d0d0d0;
}
</style>


