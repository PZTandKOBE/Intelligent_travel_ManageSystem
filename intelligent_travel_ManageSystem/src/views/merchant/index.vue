<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Edit, Delete } from '@element-plus/icons-vue'
import { 
  getMerchantListAPI, 
  addMerchantAPI, 
  updateMerchantAPI, 
  deleteMerchantAPI 
} from '@/api/merchant'
import { getICHListAPI } from '@/api/ich' // 引入项目API用于搜索下拉
import MapPicker from '@/components/MapPicker/index.vue'

// === 数据定义 ===
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const projectOptions = ref<any[]>([]) // 仅用于搜索栏的下拉

// 查询参数
const queryParams = reactive({
  current: 1,
  pageSize: 10,
  name: '',
  category: '',
  projectId: undefined as number | undefined // 搜索时仍保留此字段
})

// 表单控制
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const submitLoading = ref(false)
const formRef = ref()

// 表单数据 (新增/编辑时不包含 projectId)
const formData = reactive({
  id: undefined as number | undefined,
  name: '',
  category: '',
  address: '',
  phone: '',
  lat: undefined as number | undefined,
  lng: undefined as number | undefined,
  rating: 5.0,
  relevanceScore: 80
})

const categoryOptions = ['体验馆', '文创店', '老字号', '博物馆', '研学基地']

const rules = {
  name: [{ required: true, message: '请输入商户名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择商户类别', trigger: 'change' }],
  address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
}

// === 方法实现 ===

// 获取项目列表（仅用于搜索栏筛选）
const getProjectList = async () => {
  try {
    // 获取全部项目供下拉
    const res = await getICHListAPI({ current: 1, pageSize: 100 })
    projectOptions.value = res.data.records
  } catch (error) {
    console.error(error)
  }
}

const getList = async () => {
  loading.value = true
  try {
    const res = await getMerchantListAPI(queryParams)
    tableData.value = res.data.records
    total.value = typeof res.data.total === 'string' ? parseInt(res.data.total) : res.data.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.current = 1
  getList()
}

const handleReset = () => {
  queryParams.name = ''
  queryParams.category = ''
  queryParams.projectId = undefined
  handleSearch()
}

const openDialog = (type: 'add' | 'edit', row?: any) => {
  dialogType.value = type
  dialogVisible.value = true
  
  if (type === 'edit' && row) {
    Object.assign(formData, row)
  } else {
    // 重置表单
    formData.id = undefined
    formData.name = ''
    formData.category = ''
    formData.address = ''
    formData.phone = ''
    formData.lat = undefined
    formData.lng = undefined
    formData.rating = 5.0
    formData.relevanceScore = 80
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      if (!formData.lat || !formData.lng) {
        ElMessage.warning('请在地图上点击选择商户位置')
        return
      }
      submitLoading.value = true
      try {
        if (dialogType.value === 'add') {
          await addMerchantAPI(formData)
          ElMessage.success('新增成功')
        } else {
          await updateMerchantAPI(formData.id!, formData)
          ElMessage.success('更新成功')
        }
        dialogVisible.value = false
        getList()
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除该商户吗？', '提示', { type: 'warning' }).then(async () => {
    await deleteMerchantAPI(row.id)
    ElMessage.success('删除成功')
    getList()
  })
}

const handleCurrentChange = (val: number) => {
  queryParams.current = val
  getList()
}
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val
  queryParams.current = 1 // 切换页大小时重置到第一页
  getList()
}

// 辅助显示项目名称
const getProjectName = (id: number) => {
  const p = projectOptions.value.find(item => item.id === id)
  return p ? p.name : id
}

onMounted(() => {
  getProjectList()
  getList()
})
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="商户名称">
          <el-input v-model="queryParams.name" placeholder="模糊搜索" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="类别">
          <el-select v-model="queryParams.category" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联项目">
          <el-select v-model="queryParams.projectId" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="item in projectOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <div class="toolbar">
        <el-button type="primary" :icon="Plus" @click="openDialog('add')">新增商户</el-button>
      </div>

      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="商户名称" min-width="150" />
        <el-table-column prop="category" label="类别" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="关联项目" width="150" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.projectId" effect="plain">{{ getProjectName(row.projectId) }}</el-tag>
            <span v-else style="color:#999; font-size:12px">暂无</span>
          </template>
        </el-table-column>

        <el-table-column prop="rating" label="评分" width="80" align="center">
          <template #default="{ row }">
             <span style="color: #ff9900; font-weight: bold;">{{ row.rating }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="address" label="地址" show-overflow-tooltip />

        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="openDialog('edit', row)">编辑</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="queryParams.current"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增商户' : '编辑商户'" width="700px" top="5vh">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商户名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入店铺名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
             <el-form-item label="联系电话" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="类别" prop="category">
              <el-select v-model="formData.category" style="width: 100%">
                <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="评分">
              <el-input-number v-model="formData.rating" :min="0" :max="5" :precision="1" :step="0.1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联度">
              <el-input-number v-model="formData.relevanceScore" :min="0" :max="100" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="详细地址" prop="address">
          <el-input v-model="formData.address" placeholder="请输入详细地址" />
        </el-form-item>

        <el-form-item label="地图定位" required>
          <MapPicker 
            v-model:lat="formData.lat" 
            v-model:lng="formData.lng" 
            :search-address="formData.address"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.app-container { padding: 20px; background: #f0f2f5; min-height: calc(100vh - 84px); }
.search-card { margin-bottom: 20px; }
.toolbar { margin-bottom: 20px; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>