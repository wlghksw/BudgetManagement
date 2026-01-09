<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ editingCategory ? '카테고리 수정' : '카테고리 추가' }}</h2>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>이름</label>
          <input 
            v-model="form.name" 
            type="text" 
            required 
            placeholder="카테고리 이름을 입력하세요"
          />
        </div>
        <div class="form-group">
          <label>아이콘</label>
          <input 
            v-model="form.icon" 
            type="text" 
            placeholder="이모지 또는 텍스트"
            maxlength="2"
          />
        </div>
        <div class="form-group">
          <label>색상</label>
          <input 
            v-model="form.color" 
            type="color"
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
import { ref, watch } from 'vue';
import api from '../utils/api';

const props = defineProps({
  category: {
    type: Object,
    default: null
  },
  type: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close', 'saved']);

const form = ref({
  name: '',
  icon: '💰',
  color: '#6366f1',
  type: props.type
});

const error = ref('');
const loading = ref(false);
const editingCategory = ref(false);

watch(() => props.category, (cat) => {
  if (cat) {
    editingCategory.value = true;
    form.value = {
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      type: cat.type
    };
  }
}, { immediate: true });

watch(() => props.type, (type) => {
  if (!editingCategory.value) {
    form.value.type = type;
  }
});

const handleSubmit = async () => {
  error.value = '';
  loading.value = true;

  try {
    if (editingCategory.value && props.category) {
      await api.put(`/categories/${props.category._id}`, form.value);
    } else {
      await api.post('/categories', form.value);
    }
    emit('saved');
    emit('close');
  } catch (err) {
    error.value = err.response?.data?.error || '저장에 실패했습니다.';
  } finally {
    loading.value = false;
  }
};
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

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
}

.form-group input[type="color"] {
  height: 50px;
  cursor: pointer;
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


