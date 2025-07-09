<template>
  <div class="container">
    <h2 class="title">📁 Tải file ảnh/âm thanh để phân tích Use Case</h2>

    <form
      @submit.prevent="handleUpload"
      class="card upload-form"
      style="display: flex; justify-content: space-between; align-items: center"
    >
      <input type="file" multiple @change="onFileChange" />
      <!-- File Preview -->
      <div v-if="files.length" class="file-preview">
        <h4>📄 Tài liệu đã chọn:</h4>
        <ul>
          <li v-for="(file, index) in files" :key="index">
            <span>{{ file.name }}</span> — <small>{{ formatSize(file.size) }}</small>
          </li>
        </ul>
      </div>

      <button type="submit" class="btn primary">🚀 Phân tích</button>
    </form>

    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Đang xử lý, vui lòng chờ...</p>
    </div>

    <div v-if="accepted.length" class="usecase-section">
      <h3>✔ Use Cases đã xác nhận</h3>
      <div class="usecase-list">
        <div v-for="(uc, i) in accepted" :key="'acc-' + i" class="usecase-item accepted">
          <p class="goal">{{ formatGoal(uc.goal) }}</p>
          <span class="role">👤 {{ uc.role }}</span>
        </div>
      </div>
    </div>

    <div v-if="suggested.length" class="usecase-section">
      <h3>✨ Gợi ý thêm Use Cases (Nhấn để chọn)</h3>
      <transition-group name="fade" tag="div" class="usecase-list">
        <div
          v-for="(uc, i) in suggested"
          :key="'sug-' + i"
          class="usecase-item suggested"
          @click="toggleSelection(uc)"
          :class="{ selected: selectedSuggested.includes(uc) }"
        >
          <p class="goal">{{ formatGoal(uc.goal) }}</p>
          <span class="role">👤 {{ uc.role || 'Người dùng' }}</span>
        </div>
      </transition-group>
    </div>

    <div v-if="accepted.length || suggested.length" class="action-select">
      <div class="toggle-selectors">
        <div
          class="toggle-box"
          :class="{ active: generate.useCaseSpec }"
          @click="generate.useCaseSpec = !generate.useCaseSpec"
        >
          🧾 Use Case Spec
        </div>

        <div
          class="toggle-box"
          :class="{ active: generate.userStory }"
          @click="generate.userStory = !generate.userStory"
        >
          📘 User Story
        </div>
      </div>

      <button class="btn success" @click="handleGenerate">📄 Tạo Tài Liệu</button>
    </div>

    <div v-if="result.length" class="result-section">
      <h3>📃 Kết quả tài liệu</h3>
      <div v-for="section in result" :key="section.id" class="result-block">
        <h4>{{ section.id }} — {{ section.goal }}</h4>
        <div v-html="formatMarkdown(section.content)"></div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { marked } from 'marked'

export default {
  name: 'GenerateDocView',
  data() {
    return {
      files: [],
      generate: {
        useCaseSpec: false,
        userStory: false,
      },
      loading: false,
      result: [],
      accepted: [],
      suggested: [],
      selectedSuggested: [],
    }
  },
  methods: {
    onFileChange(e) {
      this.files = Array.from(e.target.files)
    },
    toggleSelection(uc) {
      const i = this.selectedSuggested.indexOf(uc)
      if (i > -1) this.selectedSuggested.splice(i, 1)
      else this.selectedSuggested.push(uc)
    },
    async handleUpload() {
      if (!this.files.length) return alert('📂 Hãy chọn file')
      const formData = new FormData()
      this.files.forEach((f, i) => formData.append(`file${i + 1}`, f))

      this.loading = true
      this.accepted = []
      this.suggested = []
      this.selectedSuggested = []
      this.result = []

      try {
        const res = await axios.post('/api/allinone/upload', formData)
        this.accepted = res.data.accepted_use_cases || []
        this.suggested = res.data.suggested_use_cases || []
      } catch (e) {
        console.error(e)
        alert('❌ Upload lỗi.')
      } finally {
        this.loading = false
      }
    },
    async handleGenerate() {
      const all = [...this.accepted, ...this.selectedSuggested]
      if (!all.length) return alert('⚠️ Chưa chọn Use Case nào')
      if (!this.generate.useCaseSpec && !this.generate.userStory)
        return alert('⚠️ Chọn loại tài liệu cần tạo')

      this.loading = true
      try {
        const res = await axios.post('/api/generate-doc/json', {
          use_cases: all,
          options: this.generate,
        })
        this.result = res.data
      } catch (e) {
        console.error(e)
        alert('❌ Lỗi khi sinh tài liệu')
      } finally {
        this.loading = false
      }
    },
    formatMarkdown(md) {
      return marked(md || '')
    },
    formatGoal(goal) {
      if (typeof goal === 'string') return goal
      return goal?.main || goal?.main_goal || goal?.primary || '[Missing Goal]'
    },
    formatSize(bytes) {
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    },
  },
}
</script>

<style scoped>
.container {
  max-width: 960px;
  margin: auto;
  padding: 2rem;
  font-family: 'Segoe UI', sans-serif;
}

.title {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.card {
  /* background: #fff; */
  padding: 1.5rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.05);
}

.btn {
  padding: 0.6rem 1.4rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn.primary {
  background-color: #0066cc;
  color: white;
}
.btn.primary:hover {
  background-color: #004b99;
}

.btn.success {
  background-color: #28a745;
  color: white;
}
.btn.success:hover {
  background-color: #1e7e34;
}

.loading-overlay {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  font-style: italic;
}
.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #333;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}

.usecase-section {
  margin-top: 2rem;
}
.usecase-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.usecase-item {
  /* background: #f8f9fa; */
  border: 1px solid #ccc;
  border-left: 16px solid #aaa;
  padding: 1rem;
  border-radius: 6px;
  cursor: pointer;
  flex: 1 1 45%;
  transition: all 0.3s ease-in-out;
  /* Added for text overflow handling */
  overflow: hidden; /* Ensures content doesn't spill out */
  text-overflow: ellipsis; /* Adds "..." for overflowed text */
}
.usecase-item.accepted {
  border-left-color: green;
}
.usecase-item.suggested {
  border-left-color: rgb(216, 67, 13);
}
.usecase-item.selected {
  border-left-color: green;
  /* background: #efeafd; */
  transform: scale(1.02);
}
.goal {
  font-weight: 600;
  margin-bottom: 0.3rem;
  /* Added for text overflow handling */
  white-space: nowrap; /* Keeps text on a single line */
  overflow: hidden;
  text-overflow: ellipsis;
}
.role {
  font-size: 0.9rem;
  color: #555;
  /* Added for text overflow handling */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-select {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.checkbox-group {
  display: flex;
  gap: 1rem;
}

.result-section {
  margin-top: 3rem;
}
.result-block {
  /* background: white; */
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.toggle-selectors {
  display: flex;
  gap: 1rem;
}

.toggle-box {
  flex: 1;
  text-align: center;
  padding: 0.8rem 1rem;
  border: 2px solid #bbb;
  border-radius: 8px;
  /* background: #f5f5f5; */
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: inset 0 0 0 0 transparent;
  user-select: none;
}

.toggle-box:hover {
  background: #e0e0e09a;
  color: #333;
}

.toggle-box.active {
  background: #5c2d91;
  color: white;
  border-color: #5c2d91;
  box-shadow: 0 0 0 3px rgba(92, 45, 145, 0.2);
  transform: scale(1.03);
}

.file-preview {
  margin-top: 1rem;
  padding: 1rem;
  /* background: #f9f9f9; */
  border: 1px dashed #ccc;
  border-radius: 6px;
}
.file-preview ul {
  list-style-type: none;
  padding-left: 0;
}
.file-preview li {
  margin-bottom: 0.75rem;
}
</style>