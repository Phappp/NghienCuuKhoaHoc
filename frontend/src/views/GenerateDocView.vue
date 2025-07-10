<template>
  <div class="container">
    <h2 class="title">📁 Tải file để phân tích Use Case</h2>

    <form
      @submit.prevent="handleUpload"
      class="card upload-form"
      style="display: flex; flex-direction: column; gap: 1.2rem; align-items: flex-start"
    >
      <div class="custom-file-upload">
        <button type="button" @click="triggerFileInput">
          <span style="font-size:1.2em;">📁</span> Chọn tệp
        </button>
        <span class="file-label">
          {{ files.length ? files.map(f => f.name).join(', ') : 'Chưa chọn tệp nào' }}
        </span>
        <input type="file" ref="fileInput" multiple @change="onFileChange" style="display:none" />
      </div>
      <!-- File Preview -->
      <div v-if="files.length" class="file-list-cards">
        <div v-for="(file, index) in files" :key="index" class="file-card">
          <span class="file-icon" :class="fileIconClass(file)"></span>
          <div class="file-info">
            <div class="file-name">{{ file.name }}</div>
            <div class="file-meta">{{ fileTypeLabel(file) }} {{ formatSize(file.size) }}</div>
          </div>
          <button type="button" class="remove-file-btn" @click="removeFile(index)">❌</button>
        </div>
      </div>
      <button type="submit" class="btn primary">Phân tích</button>
    </form>

    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Đang xử lý, vui lòng chờ...</p>
    </div>

    <div v-if="ocrResults.length || speechResults.length || docxResults.length" class="result-section">
      <h3>📝 Kết quả trích xuất từ từng file</h3>
      <div class="extract-type-tabs">
        <div
          v-if="ocrResults.length"
          :class="['tab', {active: showExtractType==='ocr'}]"
          @click="toggleExtractType('ocr')"
        >Ảnh (OCR)</div>
        <div
          v-if="speechResults.length"
          :class="['tab', {active: showExtractType==='speech'}]"
          @click="toggleExtractType('speech')"
        >Âm thanh (Speech-to-Text)</div>
        <div
          v-if="docxResults.length"
          :class="['tab', {active: showExtractType==='docx'}]"
          @click="toggleExtractType('docx')"
        >Văn bản (.docx)</div>
      </div>
      <div v-if="showExtractType==='ocr'">
        <h4>Ảnh (OCR)</h4>
        <div v-for="(item, i) in ocrResults" :key="'ocr-' + i" class="result-block">
          <div class="result-header">
            <b>{{ item.fileName || 'Ảnh ' + (i+1) }}</b>
            <span v-if="item.confidence !== undefined" class="confidence-bar">
              <span class="confidence-fill" :style="{width: ((item.confidence > 1 ? item.confidence : item.confidence*100) || 0) + '%'}"></span>
              <span class="confidence-label">{{ Math.round((item.confidence > 1 ? item.confidence : item.confidence*100) || 0) }}%</span>
            </span>
          </div>
          <div class="result-content">
            <pre style="white-space: pre-wrap;">{{ item.text }}</pre>
            <button class="copy-btn" @click="copyText(item.text)">Copy</button>
          </div>
        </div>
      </div>
      <div v-if="showExtractType==='speech'">
        <h4>Âm thanh (Speech-to-Text)</h4>
        <div v-for="(item, i) in speechResults" :key="'speech-' + i" class="result-block">
          <div class="result-header">
            <b>{{ item.fileName || 'Audio ' + (i+1) }}</b>
            <span v-if="item.confidence !== undefined" class="confidence-bar">
              <span class="confidence-fill" :style="{width: ((item.confidence > 1 ? item.confidence : item.confidence*100) || 0) + '%'}"></span>
              <span class="confidence-label">{{ Math.round((item.confidence > 1 ? item.confidence : item.confidence*100) || 0) }}%</span>
            </span>
          </div>
          <div class="result-content">
            <pre style="white-space: pre-wrap;">{{ item.text }}</pre>
            <button class="copy-btn" @click="copyText(item.text)">Copy</button>
          </div>
        </div>
      </div>
      <div v-if="showExtractType==='docx'">
        <h4>Văn bản (.docx)</h4>
        <div v-for="(item, i) in docxResults" :key="'docx-' + i" class="result-block">
          <div class="result-header">
            <b>{{ item.fileName || 'Docx ' + (i+1) }}</b>
            <span v-if="item.confidence !== undefined" class="confidence-bar">
              <span class="confidence-fill" :style="{width: ((item.confidence > 1 ? item.confidence : item.confidence*100) || 0) + '%'}"></span>
              <span class="confidence-label">{{ Math.round((item.confidence > 1 ? item.confidence : item.confidence*100) || 0) }}%</span>
            </span>
          </div>
          <div class="result-content">
            <pre style="white-space: pre-wrap;">{{ item.text }}</pre>
            <button class="copy-btn" @click="copyText(item.text)">Copy</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="accepted.length" class="usecase-section">
      <h3>✔ Use Cases đã xác nhận</h3>
      <div class="usecase-list">
        <div v-for="(uc, i) in accepted" :key="'acc-' + i" class="usecase-item accepted">
          <p class="goal" :title="formatGoal(uc.goal)">{{ formatGoal(uc.goal) }}</p>
          <span class="role" :title="uc.role">👤 {{ uc.role }}</span>
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
          <p class="goal" :title="formatGoal(uc.goal)">{{ formatGoal(uc.goal) }}</p>
          <span class="role" :title="uc.role">👤 {{ uc.role || 'Người dùng' }}</span>
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
      ocrResults: [],
      speechResults: [],
      docxResults: [],
      showExtractType: '',
    }
  },
  methods: {
    onFileChange(e) {
      // Thêm file mới vào danh sách, không ghi đè
      const newFiles = Array.from(e.target.files)
      // Loại bỏ file trùng tên (nếu có)
      const existingNames = this.files.map(f => f.name)
      const filtered = newFiles.filter(f => !existingNames.includes(f.name))
      this.files = this.files.concat(filtered)
      // Reset input để có thể chọn lại cùng file nếu muốn
      e.target.value = ''
    },
    removeFile(index) {
      this.files.splice(index, 1)
    },
    toggleSelection(uc) {
      const i = this.selectedSuggested.indexOf(uc)
      if (i > -1) this.selectedSuggested.splice(i, 1)
      else this.selectedSuggested.push(uc)
    },
    toggleExtractType(type) {
      this.showExtractType = this.showExtractType === type ? '' : type
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
      this.ocrResults = []
      this.speechResults = []
      this.docxResults = []
      this.showExtractType = ''

      try {
        const res = await axios.post('/api/allinone/upload', formData)
        this.accepted = res.data.accepted_use_cases || []
        this.suggested = res.data.suggested_use_cases || []
        // Lưu kết quả chi tiết từng loại file
        this.ocrResults = (res.data.ocr || []).map(item => ({ ...item, fileName: item.fileName || item.filename }))
        this.speechResults = (res.data.speech || []).map(item => ({ ...item, fileName: item.fileName || item.filename }))
        this.docxResults = (res.data.docx || []).map(item => ({ ...item, fileName: item.fileName || item.filename }))
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
    fileIconClass(file) {
      const ext = file.name.split('.').pop().toLowerCase()
      if (["jpg","jpeg","png","bmp","webp"].includes(ext)) return 'icon-image'
      if (["mp3","wav","m4a","flac","ogg","aac","webm"].includes(ext)) return 'icon-audio'
      if (["docx"].includes(ext)) return 'icon-docx'
      return 'icon-file'
    },
    fileTypeLabel(file) {
      const ext = file.name.split('.').pop().toUpperCase()
      if (["JPG","JPEG","PNG","BMP","WEBP"].includes(ext)) return 'JPG'
      if (["MP3","WAV","M4A","FLAC","OGG","AAC","WEBM"].includes(ext)) return 'AUDIO'
      if (["DOCX"].includes(ext)) return 'DOCX'
      return ext
    },
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    copyText(text) {
      navigator.clipboard.writeText(text)
        .then(() => this.$toast?.success?.('Đã copy!') || alert('Đã copy!'))
        .catch(() => alert('Copy thất bại!'))
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
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
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

/* .file-preview {
  margin-top: 1rem;
  padding: 1rem; */
  /* background: #f9f9f9; */
  /* border: 1px dashed #ccc;
  border-radius: 6px;
}
.file-preview ul {
  list-style-type: none;
  padding-left: 0;
}
.file-preview li {
  margin-bottom: 0.75rem;
} */
.extract-type-selectors {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}
.extract-type-btn {
  padding: 0.5rem 1.2rem;
  border: 1.5px solid #bbb;
  border-radius: 6px;
  /* background: #f5f5f5; */
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.extract-type-btn.active, .extract-type-btn:hover {
  background: #5c2d91;
  color: white;
  border-color: #5c2d91;
}
.remove-file-btn {
  margin-left: 0.5rem;
  background: none;
  border: none;
  color: #d32f2f;
  font-size: 1.1em;
  cursor: pointer;
  transition: color 0.2s;
}
.remove-file-btn:hover {
  color: #b71c1c;
}
.file-list-cards {
  display: flex;
  gap: 1.2rem;
  margin: 1.2rem 0 1.5rem 0;
  flex-wrap: wrap;
}
.file-card {
  display: flex;
  align-items: center;
  /* background: #f8f9fa; */
  border: 1px solid #ddd;
  border-radius: 1.2rem;
  padding: 0.7rem 1.2rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  min-width: 320px;
  max-width: 320px;
  position: relative;
}
.file-icon {
  font-size: 2.1em;
  margin-right: 0.8rem;
  display: flex;
  align-items: center;
  width: 2.2em;
  justify-content: center;
}
.icon-docx::before {
  content: '\1F4C4'; /* 📄 */
  color: #fbc02d;
}
.icon-image::before {
  content: '\1F5BC'; /* 🖼️ */
  color: #42a5f5;
}
.icon-audio::before {
  content: '\1F3A7'; /* 🎧 */
  color: #7e57c2;
}
.icon-file::before {
  content: '\1F5CE'; /* 🗎 */
  color: #90a4ae;
}
.file-info {
  flex: 1;
  min-width: 0;
}
.file-name {
  font-weight: 600;
  font-size: 1.08em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.file-meta {
  font-size: 0.95em;
  color: #888;
  margin-top: 0.1em;
}
.remove-file-btn {
  margin-left: 0.7rem;
  background: none;
  border: none;
  color: #d32f2f;
  font-size: 1.2em;
  cursor: pointer;
  transition: color 0.2s;
}
.remove-file-btn:hover {
  color: #b71c1c;
}
.custom-file-upload {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.custom-file-upload button {
  background: #5c2d91;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.7rem 1.4rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 1em;
  display: flex;
  align-items: center;
  gap: 0.5em;
  transition: background 0.2s;
}
.custom-file-upload button:hover {
  background: #3d1c6b;
}
.file-label {
  color: #888;
  font-size: 1em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}
.result-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.3em;
}
.confidence-bar {
  background: #eee;
  border-radius: 6px;
  height: 12px;
  width: 80px;
  position: relative;
  display: inline-block;
  margin-left: 0.5em;
  vertical-align: middle;
}
.confidence-fill {
  background: #5c2d91;
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s;
  display: block;
}
.confidence-label {
  position: absolute;
  left: 50%;
  top: -20px;
  transform: translateX(-50%);
  font-size: 0.9em;
  color: #5c2d91;
  font-weight: 600;
  white-space: nowrap;
}
.extract-type-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.tab {
  padding: 0.5rem 1.2rem;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-weight: 500;
  color: #5c2d91;
  background: none;
  transition: border-color 0.2s, color 0.2s;
}
.tab.active {
  border: 3px solid #b7b5b5;
  color: #b3afaf;
  border-radius: 8px;
  /* background: #f3f0fa; */
}
.tab:hover {
  color: #8d8c8c;
}
.result-content {
  position: relative;
}
.copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  display: none;
  /* background: #eee; */
  border: 1px solid #ddd9e01a;
  border-radius: 4px;
  padding: 0.2em 0.7em;
  font-size: 0.95em;
  cursor: pointer;
  color: #5c2d91;
  transition: background 0.2s;
}
.copy-btn:hover {
  background: #5c2d91;
  color: white;
}
</style>