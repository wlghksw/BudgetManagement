<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>파일 업로드</h2>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>

      <div class="upload-section">
        <!-- 사용 방법 안내 -->
        <div class="usage-guide">
          <h3>📋 사용 방법</h3>
          <ol>
            <li><strong>토스뱅크 앱</strong>에서 거래내역 내보내기
              <ul>
                <li>토스뱅크 앱 → 거래내역 → 내보내기 → CSV 파일 다운로드</li>
              </ul>
            </li>
            <li><strong>CSV 파일</strong>을 아래 영역에 드래그하거나 클릭하여 선택</li>
            <li><strong>은행 형식</strong>을 선택 (토스뱅크 선택 권장)</li>
            <li><strong>미리보기</strong>에서 거래 내역 확인</li>
            <li><strong>저장하기</strong> 버튼 클릭하여 거래 내역 추가</li>
          </ol>
          <div class="info-box">
            <p>💡 <strong>팁:</strong> CSV 파일은 날짜, 거래내용, 금액, 입출금 구분 컬럼이 포함되어 있어야 합니다.</p>
            <p>💡 중복된 거래는 자동으로 감지되어 제외됩니다.</p>
            <p>💡 거래 내용에 따라 카테고리가 자동으로 분류됩니다.</p>
          </div>
        </div>

        <input 
          ref="fileInput"
          type="file" 
          accept=".csv,.xlsx,.xls"
          @change="handleFileSelect"
          style="display: none"
        />
        <div 
          class="drop-zone"
          :class="{ 'dragover': isDragging }"
          @drop="handleDrop"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @click="$refs.fileInput.click()"
        >
          <p>📁 파일을 드래그하거나 클릭하여 선택하세요</p>
          <p class="hint">CSV, XLS, XLSX 형식 지원</p>
        </div>

        <div v-if="selectedFile" class="file-info">
          <p>선택된 파일: {{ selectedFile.name }}</p>
          <select v-model="bankFormat">
            <option value="auto">자동 감지</option>
            <option value="toss">토스뱅크</option>
          </select>
        </div>

        <div v-if="preview" class="preview-section">
          <h3>📊 미리보기</h3>
          <p class="preview-description">아래 거래 내역을 확인하고 저장하기 버튼을 클릭하세요.</p>
          <div class="preview-stats">
            <p>총 {{ preview.total }}건</p>
            <p>신규: {{ preview.new }}건</p>
            <p v-if="preview.duplicates > 0">중복: {{ preview.duplicates }}건</p>
          </div>
          <div class="preview-list">
            <div 
              v-for="(tx, index) in preview.transactions.slice(0, 10)" 
              :key="index"
              class="preview-item"
            >
              <span>{{ formatDate(tx.date) }}</span>
              <span>{{ tx.description }}</span>
              <span :class="tx.type">
                {{ tx.type === 'income' ? '+' : '-' }}{{ formatCurrency(tx.amount) }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <div class="modal-actions">
          <button @click="$emit('close')" class="btn-secondary">취소</button>
          <button 
            @click="handleUpload" 
            class="btn-primary"
            :disabled="!selectedFile || loading"
          >
            {{ loading ? '업로드 중...' : '업로드' }}
          </button>
          <button 
            v-if="preview"
            @click="handleSave"
            class="btn-primary"
            :disabled="loading"
          >
            {{ loading ? '저장 중...' : '저장하기' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from '../utils/api';

const emit = defineEmits(['close', 'uploaded']);

const fileInput = ref(null);
const selectedFile = ref(null);
const bankFormat = ref('auto');
const isDragging = ref(false);
const preview = ref(null);
const error = ref('');
const loading = ref(false);
const uploadData = ref(null);

const handleFileSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    selectedFile.value = file;
    processFile(file);
  }
};

const handleDrop = (e) => {
  e.preventDefault();
  isDragging.value = false;
  const file = e.dataTransfer.files[0];
  if (file) {
    selectedFile.value = file;
    processFile(file);
  }
};

const processFile = async (file) => {
  error.value = '';
  preview.value = null;
  loading.value = true;

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', bankFormat.value);

    const endpoint = file.name.endsWith('.csv') ? '/upload/csv' : '/upload/excel';
    const response = await api.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    preview.value = response.data.preview;
    uploadData.value = response.data.data;
  } catch (err) {
    error.value = err.response?.data?.error || '파일 처리에 실패했습니다.';
  } finally {
    loading.value = false;
  }
};

const handleUpload = () => {
  if (!selectedFile.value) return;
  processFile(selectedFile.value);
};

const handleSave = async () => {
  if (!uploadData.value) return;

  loading.value = true;
  error.value = '';

  try {
    await api.post('/upload/save', { transactions: uploadData.value });
    emit('uploaded');
    emit('close');
  } catch (err) {
    error.value = err.response?.data?.error || '저장에 실패했습니다.';
  } finally {
    loading.value = false;
  }
};

import { formatCurrency } from '../utils/currency';

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ko-KR');
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
  max-width: 700px;
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

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
}

.usage-guide {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.usage-guide h3 {
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.1rem;
}

.usage-guide ol {
  margin-left: 1.5rem;
  margin-bottom: 1rem;
  line-height: 1.8;
}

.usage-guide li {
  margin-bottom: 0.5rem;
  color: #555;
}

.usage-guide ul {
  margin-left: 1.5rem;
  margin-top: 0.5rem;
  list-style-type: disc;
}

.usage-guide strong {
  color: #333;
}

.info-box {
  background: #e0f2fe;
  border-left: 4px solid #3b82f6;
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
}

.info-box p {
  margin: 0.5rem 0;
  color: #1e40af;
  font-size: 0.9rem;
}

.info-box p:first-child {
  margin-top: 0;
}

.info-box p:last-child {
  margin-bottom: 0;
}

.drop-zone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.drop-zone:hover,
.drop-zone.dragover {
  border-color: #667eea;
  background-color: #f0f4ff;
}

.file-info {
  margin-top: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
}

.file-info select {
  margin-top: 0.5rem;
  padding: 0.5rem;
  width: 100%;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
}

.preview-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
}

.preview-description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.preview-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.preview-list {
  max-height: 300px;
  overflow-y: auto;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.preview-item span.income {
  color: #10b981;
}

.preview-item span.expense {
  color: #ef4444;
}

.error-message {
  color: #ef4444;
  margin: 1rem 0;
  padding: 0.5rem;
  background-color: #fee;
  border-radius: 6px;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
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
  cursor: not-allowed;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}
</style>

