import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginAPI, getUserInfoAPI, logoutAPI } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<any>(null)
  const token = ref<string>('') // 如果是Cookie模式，token可能不需要显式存，主要存用户信息

  // 登录动作
  const login = async (loginForm: any) => {
    const res = await loginAPI(loginForm)
    userInfo.value = res.data
    // 如果后端返回token，在这里保存
    return res
  }

  // 获取用户信息
  const getUserInfo = async () => {
    const res = await getUserInfoAPI()
    userInfo.value = res.data
    return res
  }

  // 登出
  const logout = async () => {
    await logoutAPI()
    userInfo.value = null
  }

  return { userInfo, login, getUserInfo, logout }
})