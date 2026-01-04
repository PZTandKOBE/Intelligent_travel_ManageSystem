<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getMerchantListAPI, addMerchantAPI, updateMerchantAPI, deleteMerchantAPI } from '@/api/merchant'
import { getICHListAPI } from '@/api/ich' // 用于获取非遗项目下拉列表
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

// --- 数据定义 ---
const tableData = ref([])
const total = ref(0)
const loading = ref(false)
// 项目下拉列表选项
const projectOptions = ref<any[]>([])

const queryParams = reactive({
  current: 1,
  pageSize: 10,
  name: '',
  category: '',
  projectId: undefined // 筛选关联项目
})

const dialogVisible = ref(false)
const dialogTitle = ref('新增商户')
const formRef = ref<FormInstance>()

const formData = reactive({
  id: undefined as number | undefined,
  name: '',
  category: '',
  projectId: undefined as number | undefined,
  address: '',
  phone: '',
  rating: 5.0, // 默认评分
  relevanceScore: 80, // 默认关联度
  lat: 23.1291,
  lng: 113.2644
})

const rules = {
  name: [{ required: true, message: '请输入商户名称', trigger: 'blur' }],
  category: [{ required: true, message: '请输入商户类别', trigger: 'blur' }],
  projectId: [{ required: true, message: '请选择关联非遗项目', trigger: 'change' }]
}

// --- 方法定义 ---

// 1. 获取商户列表
const getList = async () => {
  loading.value = true
  try {
    const res = await getMerchantListAPI(queryParams)
    if (res && res.data) {
      tableData.value = res.data.records || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 2. 获取非遗项目列表（用于下拉框）
// 注意：这里为了简单直接取了前100个，实际业务中可能需要专门的下拉接口
const getProjectOptions = async () => {
  try {
    const res = await getICHListAPI({ current: 1, pageSize: 100 })
    if (res && res.data) {
      projectOptions.value = res.data.records
    }
  } catch (e) {
    console.error(e)
  }
}

// 3. 打开新增弹窗
const handleAdd = () => {
  dialogTitle.value = '新增商户'
  Object.assign(formData, {
    id: undefined,
    name: '',
    category: '',
    projectId: undefined,
    address: '',
    phone: '',
    rating: 5.0,
    relevanceScore: 80,
    lat: 23.1291,
    lng: 113.2644
  })
  dialogVisible.value = true
}

// 4. 打开编辑弹窗
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑商户'
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 5. 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (formData.id) {
          await updateMerchantAPI(formData.id, formData)
          ElMessage.success('更新成功')
        } else {
          await addMerchantAPI(formData)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        getList()
      } catch (e) {
        // request.ts 已处理错误
      }
    }
  })
}

// 6. 删除
const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认删除商户 "${row.name}" 吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteMerchantAPI(row.id)
    ElMessage.success('删除成功')
    getList()
  })
}

// 辅助函数：根据ID找项目名称
const formatProjectName = (pid: number) => {
  const p = projectOptions.value.find((item: any) => item.id === pid)
  return p ? p.name : pid
}

onMounted(() => {
  getList()
  getProjectOptions()
})
</script>

<template>
  <div class="app-container" style="padding: 20px;">
    <el-card class="mb-20">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="商户名称">
          <el-input v-model="queryParams.name" placeholder="请输入名称" clearable />
        </el-form-item>
        <el-form-item label="类别">
          <el-input v-model="queryParams.category" placeholder="如：体验馆" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getList">查询</el-button>
          <el-button type="success" @click="handleAdd">新增商户</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top: 20px;">
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="商户名称" width="180" />
        <el-table-column prop="category" label="类别" width="120" />
        <el-table-column label="关联非遗项目" width="150">
          <template #default="scope">
            <el-tag effect="plain">{{ formatProjectName(scope.row.projectId) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" show-overflow-tooltip />
        <el-table-column prop="rating" label="评分" width="120" align="center">
          <template #default="scope">
            <el-rate v-model="scope.row.rating" disabled show-score text-color="#ff9900" />
          </template>
        </el-table-column>
        <el-table-column prop="relevanceScore" label="关联度" width="100" align="center" />
        
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="scope">
            <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
        <el-pagination
          v-model:current-page="queryParams.current"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="getList"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="商户名称" prop="name">
          <el-input v-model="formData.name" placeholder="例如：广绣艺术馆" />
        </el-form-item>
        <el-form-item label="商户类别" prop="category">
          <el-input v-model="formData.category" placeholder="例如：体验馆、文创店" />
        </el-form-item>
        <el-form-item label="关联项目" prop="projectId">
          <el-select v-model="formData.projectId" placeholder="请选择关联的非遗项目" style="width: 100%">
            <el-option
              v-for="item in projectOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="formData.phone" />
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model="formData.address" type="textarea" :rows="2" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="评分">
              <el-input-number v-model="formData.rating" :min="0" :max="5" :step="0.1" :precision="1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
             <el-form-item label="关联度">
              <el-input-number v-model="formData.relevanceScore" :min="0" :max="100" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
             <el-form-item label="经度(Lng)">
               <el-input-number v-model="formData.lng" :precision="6" :step="0.0001" style="width: 100%" />
             </el-form-item>
          </el-col>
          <el-col :span="12">
             <el-form-item label="纬度(Lat)">
               <el-input-number v-model="formData.lat" :precision="6" :step="0.0001" style="width: 100%" />
             </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>