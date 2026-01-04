<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getMerchantListAPI, deleteMerchantAPI } from '@/api/merchant'
import { ElMessage, ElMessageBox } from 'element-plus'

const tableData = ref([])
const total = ref(0)
const loading = ref(false)
const queryParams = reactive({ current: 1, pageSize: 10, name: '' })

const getList = async () => {
  loading.value = true
  try {
    const res = await getMerchantListAPI(queryParams)
    tableData.value = res.data.records
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确认删除?').then(async () => {
    await deleteMerchantAPI(row.id)
    ElMessage.success('删除成功')
    getList()
  })
}

onMounted(() => getList())
</script>

<template>
  <div class="app-container" style="padding: 20px;">
    <el-card>
      <el-form :inline="true">
        <el-form-item label="商户名称">
          <el-input v-model="queryParams.name" placeholder="请输入" />
        </el-form-item>
        <el-button type="primary" @click="getList">查询</el-button>
        <el-button type="success">新增商户</el-button>
      </el-form>

      <el-table :data="tableData" v-loading="loading" border style="margin-top: 20px;">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="category" label="类别" />
        <el-table-column prop="rating" label="评分" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button type="primary" link>编辑</el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        style="margin-top: 20px; text-align: right;"
        v-model:current-page="queryParams.current"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="getList"
      />
    </el-card>
  </div>
</template>