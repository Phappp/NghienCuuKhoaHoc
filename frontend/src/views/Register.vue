<template>
  <div class="register-container">
    <h2>Đăng ký tài khoản</h2>
    <form @submit.prevent="handleRegister">
      <input v-model="name" type="text" placeholder="Họ và tên" required />
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Mật khẩu" required />
      <input v-model="confirmPassword" type="password" placeholder="Xác nhận mật khẩu" required />
      <input v-model="avatar" type="text" placeholder="Avatar (tuỳ chọn)" />
      <button type="submit">Đăng ký</button>
      <p v-if="message">{{ message }}</p>
    </form>
    <p class="switch-link">
      Đã có tài khoản?
      <router-link to="/login">Đăng nhập</router-link>
    </p>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  setup() {
    const name = ref('')
    const email = ref('')
    const password = ref('')
    const confirmPassword = ref('')
    const avatar = ref('')
    const message = ref('')

    const handleRegister = async () => {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.value,
            email: email.value,
            password: password.value,
            confirmPassword: confirmPassword.value,
            avatar: avatar.value
          })
        })

        const data = await res.json()
        if (!res.ok) {
          message.value = data.message || 'Đăng ký thất bại'
        } else {
          message.value = 'Đăng ký thành công!'
        }
      } catch (err) {
        message.value = 'Lỗi kết nối đến server'
      }
    }

    return { name, email, password, confirmPassword, avatar, message, handleRegister }
  }
}
</script>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 50px auto;
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
