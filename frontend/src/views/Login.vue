<template>
  <div class="login-container">
    <h2>Đăng nhập</h2>
    <form @submit.prevent="handleLogin">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Mật khẩu" required />
      <button type="submit">Đăng nhập</button>
      <p v-if="message">{{ message }}</p>
    </form>
    <p class="switch-link">
      Chưa có tài khoản?
      <router-link to="/register">Đăng ký ngay</router-link>
    </p>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  setup() {
    const email = ref('')
    const password = ref('')
    const message = ref('')
    const router = useRouter()

    const handleLogin = async () => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.value, password: password.value })
        })

        const data = await res.json()
        if (!res.ok) {
          message.value = data.message || 'Đăng nhập thất bại'
        } else {
          message.value = 'Đăng nhập thành công!'
          localStorage.setItem('token', data.token || 'true')
          router.push('/')
        }
      } catch (err) {
        message.value = 'Lỗi kết nối đến server'
      }
    }

    return { email, password, message, handleLogin }
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
input, button {
  padding: 8px;
  font-size: 1rem;
}
button {
  background-color: #42b983;
  color: white;
  border: none;
  cursor: pointer;
}
.switch-link {
  text-align: center;
  margin-top: 10px;
}
.switch-link a {
  color: #42b983;
  text-decoration: underline;
  cursor: pointer;
}

</style>
