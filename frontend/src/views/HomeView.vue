<template>
  <div class="home-container">
    <h1>Chào mừng bạn đến trang chủ</h1>
    <button @click="goToGenerateDoc" class="nav-btn">Tạo tài liệu</button>
    <button @click="logout">Đăng xuất</button>
  </div>
</template>

<script>
export default {
  methods: {
    logout() {
      localStorage.removeItem('token')
      this.$router.push('/login')
    },
    goToGenerateDoc() {
      this.$router.push('/generate-doc')
    }
  }
}
</script>

<style scoped>
.home-container {
  text-align: center;
  margin-top: 100px;
}
button {
  padding: 10px 20px;
  background: #f44336;
  color: white;
  border: none;
  cursor: pointer;
}
.nav-btn {
  background: #5c2d91;
  margin-right: 1rem;
}
.nav-btn:hover {
  background: #3d1c6b;
}
</style>
