<template>
  <div class="home-container">
    <h1>Chào mừng bạn đến trang chủ</h1>
    <button @click="logout">Đăng xuất</button>
  </div>
</template>

<script>
export default {
  methods: {
    logout() {
      localStorage.removeItem('token')
      this.$router.push('/login')
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
</style>
