<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>💰 월급 설정</h2>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>실수령액 (월급)</label>
          <input 
            v-model.number="form.salary" 
            type="number" 
            placeholder="예: 2200000"
            required
            min="0"
            step="1000"
          />
          <p class="form-hint">세금 공제 후 실제 받는 금액을 입력하세요.</p>
        </div>

        <div class="allocation-section">
          <h3>예산 분배 비율 (%)</h3>
          <p class="section-hint">월급에서 각 카테고리별로 얼마나 사용할지 비율을 설정하세요. 합계는 100%가 되어야 합니다.</p>
          
          <div class="allocation-grid">
            <div class="allocation-item">
              <label>적금</label>
              <input 
                v-model.number="form.allocation.savings" 
                type="number" 
                min="0" 
                max="100"
                step="1"
                @input="validateTotal"
              />
              <span class="allocation-amount">{{ calculateAmount('savings') }}</span>
            </div>
            <div class="allocation-item">
              <label>보험</label>
              <input 
                v-model.number="form.allocation.insurance" 
                type="number" 
                min="0" 
                max="100"
                step="1"
                @input="validateTotal"
              />
              <span class="allocation-amount">{{ calculateAmount('insurance') }}</span>
            </div>
            <div class="allocation-item">
              <label>주거/통신</label>
              <input 
                v-model.number="form.allocation.living" 
                type="number" 
                min="0" 
                max="100"
                step="1"
                @input="validateTotal"
              />
              <span class="allocation-amount">{{ calculateAmount('living') }}</span>
            </div>
            <div class="allocation-item">
              <label>식비</label>
              <input 
                v-model.number="form.allocation.food" 
                type="number" 
                min="0" 
                max="100"
                step="1"
                @input="validateTotal"
              />
              <span class="allocation-amount">{{ calculateAmount('food') }}</span>
            </div>
            <div class="allocation-item">
              <label>교통비</label>
              <input 
                v-model.number="form.allocation.transportation" 
                type="number" 
                min="0" 
                max="100"
                step="1"
                @input="validateTotal"
              />
              <span class="allocation-amount">{{ calculateAmount('transportation') }}</span>
            </div>
            <div class="allocation-item">
              <label>쇼핑</label>
              <input 
                v-model.number="form.allocation.shopping" 
                type="number" 
                min="0" 
                max="100"
                step="1"
                @input="validateTotal"
              />
              <span class="allocation-amount">{{ calculateAmount('shopping') }}</span>
            </div>
            <div class="allocation-item">
              <label>문화/여가</label>
              <input 
                v-model.number="form.allocation.culture" 
                type="number" 
                min="0" 
                max="100"
                step="1"
                @input="validateTotal"
              />
              <span class="allocation-amount">{{ calculateAmount('culture') }}</span>
            </div>
            <div class="allocation-item">
              <label>기타</label>
              <input 
                v-model.number="form.allocation.other" 
                type="number" 
                min="0" 
                max="100"
                step="1"
                @input="validateTotal"
              />
              <span class="allocation-amount">{{ calculateAmount('other') }}</span>
            </div>
          </div>

          <div class="total-percentage" :class="{ 'error': totalPercentage !== 100 }">
            <strong>합계: {{ totalPercentage }}%</strong>
            <span v-if="totalPercentage !== 100" class="error-text">
              (100%가 되어야 합니다)
            </span>
          </div>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <div class="modal-actions">
          <button type="button" @click="$emit('close')" class="btn-secondary">취소</button>
          <button type="submit" class="btn-primary" :disabled="loading || totalPercentage !== 100">
            {{ loading ? '저장 중...' : '저장' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../utils/api';
import { formatCurrency } from '../utils/currency';

const emit = defineEmits(['close', 'saved']);

const form = ref({
  salary: null,
  allocation: {
    savings: 20,
    insurance: 10,
    living: 15,
    food: 25,
    transportation: 8,
    shopping: 10,
    culture: 7,
    other: 5
  }
});

const error = ref('');
const loading = ref(false);

const totalPercentage = computed(() => {
  return Object.values(form.value.allocation).reduce((sum, val) => sum + (val || 0), 0);
});

const calculateAmount = (key) => {
  if (!form.value.salary) return '₩0';
  const percentage = form.value.allocation[key] || 0;
  const amount = Math.round((form.value.salary * percentage) / 100);
  return formatCurrency(amount);
};

const validateTotal = () => {
  if (totalPercentage.value > 100) {
    error.value = '비율의 합이 100%를 초과할 수 없습니다.';
  } else {
    error.value = '';
  }
};

const loadUserProfile = async () => {
  try {
    const response = await api.get('/users/profile');
    if (response.data.salary) {
      form.value.salary = response.data.salary;
    }
    if (response.data.budgetAllocation) {
      form.value.allocation = { ...form.value.allocation, ...response.data.budgetAllocation };
    }
  } catch (err) {
    console.error('프로필 로드 실패:', err);
  }
};

const handleSubmit = async () => {
  if (totalPercentage.value !== 100) {
    error.value = '비율의 합이 정확히 100%가 되어야 합니다.';
    return;
  }

  error.value = '';
  loading.value = true;

  try {
    await api.put('/users/profile', {
      salary: form.value.salary,
      budgetAllocation: form.value.allocation
    });
    emit('saved');
    emit('close');
  } catch (err) {
    error.value = err.response?.data?.error || '저장에 실패했습니다.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadUserProfile();
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
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
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
  color: #0f172a;
  font-weight: 700;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #64748b;
  line-height: 1;
}

.close-btn:hover {
  color: #0f172a;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #0f172a;
  font-weight: 600;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-hint {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 0.5rem;
}

.allocation-section {
  margin-bottom: 1.5rem;
}

.allocation-section h3 {
  margin-bottom: 0.5rem;
  color: #0f172a;
  font-weight: 700;
}

.section-hint {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 1rem;
}

.allocation-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.allocation-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.allocation-item label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
}

.allocation-item input {
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
}

.allocation-amount {
  font-size: 0.75rem;
  color: #10b981;
  font-weight: 600;
}

.total-percentage {
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  text-align: center;
  font-size: 1.1rem;
  color: #0f172a;
}

.total-percentage.error {
  background: #fef2f2;
  border: 1px solid #ef4444;
}

.error-text {
  color: #ef4444;
  font-size: 0.875rem;
  margin-left: 0.5rem;
}

.error-message {
  color: #ef4444;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: #fef2f2;
  border-radius: 8px;
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
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #10b981;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #059669;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #e2e8f0;
}
</style>

