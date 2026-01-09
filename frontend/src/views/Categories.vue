<template>
  <div class="categories-page">
    <div class="page-header">
      <h1>카테고리 관리</h1>
      <div class="header-actions">
        <button @click="createDefaultCategories" class="btn-secondary">
          기본 카테고리 생성
        </button>
        <button @click="showAddModal = true" class="btn-primary">
          + 카테고리 추가
        </button>
      </div>
    </div>

    <div class="categories-tabs">
      <button
        @click="activeTab = 'expense'"
        :class="{ active: activeTab === 'expense' }"
        class="tab-btn"
      >
        지출 카테고리
      </button>
      <button
        @click="activeTab = 'income'"
        :class="{ active: activeTab === 'income' }"
        class="tab-btn"
      >
        수입 카테고리
      </button>
    </div>

    <div class="categories-grid">
      <div
        v-for="cat in filteredCategories"
        :key="cat._id"
        class="category-card"
      >
        <div class="category-icon" :style="{ backgroundColor: cat.color }">
          {{ cat.icon }}
        </div>
        <div class="category-info">
          <h3>{{ cat.name }}</h3>
          <p v-if="cat.isDefault" class="default-badge">기본</p>
        </div>
        <div class="category-actions">
          <button @click="editCategory(cat)" class="icon-btn">✏️</button>
          <button
            v-if="!cat.isDefault"
            @click="deleteCategory(cat._id)"
            class="icon-btn"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <CategoryModal
      v-if="showAddModal || editingCategory"
      :category="editingCategory"
      :type="activeTab"
      @close="closeModal"
      @saved="loadCategories"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import api from "../utils/api";
import CategoryModal from "../components/CategoryModal.vue";

const categories = ref([]);
const activeTab = ref("expense");
const showAddModal = ref(false);
const editingCategory = ref(null);

const filteredCategories = computed(() => {
  return categories.value.filter((cat) => cat.type === activeTab.value);
});

const loadCategories = async () => {
  try {
    const response = await api.get("/categories");
    categories.value = response.data;
  } catch (error) {
    console.error("카테고리 로드 실패:", error);
  }
};

const createDefaultCategories = async () => {
  if (!confirm("기본 카테고리를 생성하시겠습니까?")) return;

  try {
    await api.get("/categories/default");
    alert("기본 카테고리가 생성되었습니다.");
    loadCategories();
  } catch (error) {
    alert("기본 카테고리 생성에 실패했습니다.");
  }
};

const editCategory = (cat) => {
  editingCategory.value = cat;
};

const deleteCategory = async (id) => {
  if (!confirm("정말 삭제하시겠습니까?")) return;

  try {
    await api.delete(`/categories/${id}`);
    loadCategories();
  } catch (error) {
    alert("삭제에 실패했습니다.");
  }
};

const closeModal = () => {
  showAddModal.value = false;
  editingCategory.value = null;
};

onMounted(() => {
  loadCategories();
});
</script>

<style scoped>
.categories-page {
  padding: 2rem 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.categories-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.category-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.category-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.category-info {
  text-align: center;
}

.category-info h3 {
  margin-bottom: 0.5rem;
  color: #333;
}

.default-badge {
  font-size: 0.75rem;
  color: #666;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
}

.category-actions {
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
</style>
