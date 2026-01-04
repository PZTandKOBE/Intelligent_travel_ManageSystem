<template>
  <div class="common-layout">
    <el-container>
      <el-aside width="200px" class="aside">
        <el-menu router :default-active="$route.path" class="el-menu-vertical">
          <div class="logo">非遗伴游后台</div>
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>数据概览</span>
          </el-menu-item>
          <el-menu-item index="/knowledge/list">
            <el-icon><Reading /></el-icon>
            <span>知识库管理</span>
          </el-menu-item>
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
.aside { background-color: #545c64; color: #fff; }
.logo { height: 60px; line-height: 60px; text-align: center; font-weight: bold; font-size: 18px; color: #fff; border-bottom: 1px solid #666; }
.header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #eee; }
.el-menu { border-right: none; background-color: transparent; }
.el-menu-item { color: #fff; }
.el-menu-item.is-active { background-color: #434a50; color: #ffd04b; }
</style>