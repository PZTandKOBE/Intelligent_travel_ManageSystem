<script setup lang="ts">
import { useUserStore } from '@/store/user'
import { computed } from 'vue'

const userStore = useUserStore()
const username = computed(() => userStore.userInfo?.userName || '管理员')
</script>

<template>
  <div class="dashboard-container">
    <el-card class="welcome-card">
      <div class="welcome-content">
        <div class="text-content">
          <h2 class="title">欢迎回来，{{ username }}！👋</h2>
          <p class="subtitle">这里是非遗文化智能伴游系统的管理中枢。</p>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">ICH</div>
              <div class="stat-label">非遗项目管理</div>
              <el-button type="primary" link @click="$router.push('/ich/list')">去管理 ></el-button>
            </div>
            <div class="stat-item">
              <div class="stat-value">Store</div>
              <div class="stat-label">商户资源管理</div>
              <el-button type="primary" link @click="$router.push('/merchant/list')">去管理 ></el-button>
            </div>
            <div class="stat-item">
              <div class="stat-value">RAG</div>
              <div class="stat-label">知识库管理</div>
              <el-button type="primary" link @click="$router.push('/knowledge/list')">去管理 ></el-button>
            </div>
          </div>
        </div>
        <img src="https://element-plus.org/images/element-plus-logo.svg" class="welcome-img" alt="logo" />
      </div>
    </el-card>

    <div class="info-section">
      <el-alert
        title="系统提示"
        type="info"
        description="您可以点击左侧菜单栏进行非遗项目录入、商户信息更新以及知识库文档的上传。上传的文档将自动用于 AI 伴游助手的问答服务。"
        show-icon
        :closable="false"
      />
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  padding: 20px;
}
.welcome-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #fff 0%, #f0f2f5 100%);
}
.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.text-content {
  flex: 1;
}
.title {
  font-size: 24px;
  color: #303133;
  margin-bottom: 10px;
}
.subtitle {
  color: #909399;
  margin-bottom: 30px;
}
.welcome-img {
  width: 200px;
  opacity: 0.8;
}
.stats-grid {
  display: flex;
  gap: 40px;
}
.stat-item {
  text-align: left;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
  min-width: 120px;
}
.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #409EFF;
}
.stat-label {
  font-size: 14px;
  color: #606266;
  margin: 5px 0 10px;
}
</style>