<script setup lang="ts">
// 确保引入了这些图标，否则图标不显示
import { Odometer, Reading, GoldMedal, Shop, Document } from '@element-plus/icons-vue'
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-aside width="200px" class="aside">
        <el-menu 
          router 
          :default-active="$route.path" 
          class="el-menu-vertical"
          background-color="#545c64"
          text-color="#fff"
          active-text-color="#ffd04b"
        >
          <div class="logo">非遗伴游后台</div>

          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>数据概览</span>
          </el-menu-item>

          <el-sub-menu index="/ich">
            <template #title>
              <el-icon><GoldMedal /></el-icon>
              <span>非遗项目</span>
            </template>
            <el-menu-item index="/ich/list">项目列表</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="/merchant">
            <template #title>
              <el-icon><Shop /></el-icon>
              <span>商户管理</span>
            </template>
            <el-menu-item index="/merchant/list">商户列表</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="/knowledge">
            <template #title>
              <el-icon><Reading /></el-icon>
              <span>知识库管理</span>
            </template>
            <el-menu-item index="/knowledge/list">文档列表</el-menu-item>
          </el-sub-menu>

        </el-menu>
      </el-aside>
      
      <el-container>
        <el-header class="header">
          <div class="breadcrumb">非遗文化智能伴游系统</div>
          <el-button type="danger" link>退出登录</el-button>
        </el-header>
        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style scoped>
.common-layout, .el-container { height: 100vh; }
.aside { background-color: #545c64; overflow: hidden; } /* 防止侧边栏出现滚动条 */
.logo { 
  height: 60px; 
  line-height: 60px; 
  text-align: center; 
  font-weight: bold; 
  font-size: 18px; 
  color: #fff; 
  border-bottom: 1px solid #666; 
  background-color: #545c64;
}
.header { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  border-bottom: 1px solid #eee; 
  background-color: #fff;
}
.el-menu-vertical {
  border-right: none;
}
/* 调整一些样式细节 */
:deep(.el-sub-menu__title) {
  color: #fff !important;
}
:deep(.el-sub-menu__title:hover) {
  background-color: #434a50 !important;
}
.el-menu-item:hover {
  background-color: #434a50 !important;
}
</style>