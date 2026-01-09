<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ editingBudget ? '예산 수정' : '예산 설정' }}</h2>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>카테고리</label>
          <select v-model="form.categoryId" required>
            <option value="">카테고리 선택</option>
            <option 
              v-for="cat in expenseCategories" 
              :key="cat._id" 
              :value="cat._id"
            >
              {{ cat.icon }} {{ cat.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>예산 금액</label>
          <input 
            v-model.number="form.amount" 
            type="number" 
            required 
            min="0"
            placeholder="예산 금액을 입력하세요"
          />
        </div>
        <div class="form-group">
          <label>월</label>
          <select v-model="form.month" required>
            <option v-for="m in 12" :key="m" :value="m">{{ m }}월</option>
          </select>
        </div>
        <div class="form-group">
          <label>연도</label>
          <input 
            v-model.number="form.year" 
            type="number" 
            required 
            min="2020"
            max="2100"
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
  budget: {
    type: Object,
    default: null
  },
  month: {
    type: Number,
    default: () => new Date().getMonth() + 1
  },
  year: {
    type: Number,
    default: () => new Date().getFullYear()
  }
});

const emit = defineEmits(['close', 'saved']);

const form = ref({
  categoryId: '',
  amount: 0,
  month: props.month,
  year: props.year
});

const expenseCategories = ref([]);
const error = ref('');
const loading = ref(false);
const editingBudget = ref(false);

const loadCategories = async () => {
  try {
    const response = await api.get('/categories?type=expense');
    expenseCategories.value = response.data;
  } catch (err) {
    console.error('카테고리 로드 실패:', err);
  }
};

watch(() => props.budget, (budget) => {
  if (budget) {
    editingBudget.value = true;
    form.value = {
      categoryId: budget.categoryId._id || budget.categoryId,
      amount: budget.amount,
      month: budget.month,
      year: budget.year
    };
  }
}, { immediate: true });

watch(() => [props.month, props.year], ([month, year]) => {
  if (!editingBudget.value) {
    form.value.month = month;
    form.value.year = year;
  }
});

const handleSubmit = async () => {
  error.value = '';
  loading.value = true;

  try {
    if (editingBudget.value && props.budget) {
      await api.put(`/budgets/${props.budget._id}`, form.value);
    } else {
      await api.post('/budgets', form.value);
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
  padding: 2rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
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
}

.error-message {
  color: #ef4444;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: #fee;
  border-radius: 6px;
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
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:disabled {
  opacity: 0.6;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}
</style>


