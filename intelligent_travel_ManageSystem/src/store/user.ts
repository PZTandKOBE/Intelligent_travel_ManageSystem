import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<any>(null)

  // 这里的登录逻辑通常只负责保存前端状态，
  // 实际 Cookie 由浏览器自动管理
  function setUser(data: any) {
    userInfo.value = data
  }

  function clearUser() {
    userInfo.value = null
  }

  return { userInfo, setUser, clearUser }
})