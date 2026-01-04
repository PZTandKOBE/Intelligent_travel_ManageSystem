import { createRouter, createWebHistory } from 'vue-router'
// 关键点：使用 type 关键字导入类型
import type { RouteRecordRaw } from 'vue-router'

// 这里的 Layout 导入取决于你是否创建了该文件，如果没有创建，请先创建或暂时注释掉
import Layout from '@/layout/index.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    // 确保 src/views/login/index.vue 文件存在，否则这里还会报错
    component: () => import('@/views/login/index.vue'),
    meta: { hidden: true }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        // 确保 src/views/dashboard/index.vue 文件存在
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据概览', icon: 'Odometer' }
      }
    ]
  },
  {
    path: '/knowledge',
    component: Layout,
    redirect: '/knowledge/list',
    meta: { title: '知识库管理', icon: 'Reading' },
    children: [
      {
        path: 'list',
        name: 'KnowledgeList',
        // 确保 src/views/knowledge/index.vue 文件存在
        component: () => import('@/views/knowledge/index.vue'),
        meta: { title: '文档列表' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router