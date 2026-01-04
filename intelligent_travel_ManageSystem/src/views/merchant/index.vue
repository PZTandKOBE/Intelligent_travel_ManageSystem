<template>
  <div class="app-container">
    <el-card shadow="never" class="mb-4">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="商户名称">
          <el-input v-model="queryParams.name" placeholder="请输入名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button type="success" icon="Plus" @click="handleAdd">新增商户</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table v-loading="loading" :data="tableData" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="商户名称" />
      <el-table-column prop="category" label="类型" width="100" />
      <el-table-column prop="projectId" label="关联非遗ID" width="100" />
      <el-table-column prop="rating" label="评分" width="80" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" icon="Edit" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="queryParams.current"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleQuery"
        @current-change="handleQuery"
      />
    </div>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="商户名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="类型" prop="category">
          <el-select v-model="form.category" style="width: 100%">
            <el-option label="体验馆" value="体验馆" />
            <el-option label="文创店" value="文创店" />
            <el-option label="老字号" value="老字号" />
            <el-option label="博物馆" value="博物馆" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联非遗项目" prop="projectId">
          <el-select
            v-model="form.projectId"
            filterable
            remote
            reserve-keyword
            placeholder="请输入项目名称搜索"
            :remote-method="searchProjects"
            :loading="projectSearchLoading"
            style="width: 100%"
          >
            <el-option
              v-for="item in projectOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="地理位置">
          <MapPicker v-model:lat="form.lat" v-model:lng="form.lng" />
        </el-form-item>
        <el-form-item label="评分">
          <el-rate v-model="form.rating" :max="5" allow-half />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getMerchantListAPI, addMerchantAPI, updateMerchantAPI, deleteMerchantAPI } from '@/api/merchant'
import { getICHListAPI } from '@/api/ich'
import { ElMessage, ElMessageBox } from 'element-plus'
import MapPicker from '@/components/MapPicker/index.vue'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()

const projectSearchLoading = ref(false)
const projectOptions = ref<any[]>([])

const queryParams = reactive({
  current: 1,
  pageSize: 10,
  name: ''
})

const form = reactive({
  id: undefined,
  name: '',
  category: '',
  projectId: undefined,
  address: '',
  phone: '',
  lat: undefined as number | undefined,
  lng: undefined as number | undefined,
  rating: 5,
  relevanceScore: 90
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  projectId: [{ required: true, message: '请关联非遗项目', trigger: 'change' }]
}

const handleQuery = async () => {
  loading.value = true
  try {
    // 修复：添加 : any 类型断言，解决 res.code 报错
    const res: any = await getMerchantListAPI(queryParams)
    if (res.code === 0) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

// 远程搜索非遗项目
const searchProjects = async (query: string) => {
  if (query) {
    projectSearchLoading.value = true
    try {
      // 修复：添加 : any 类型断言，解决 res.code 报错
      const res: any = await getICHListAPI({ name: query, current: 1, pageSize: 20 })
      if (res.code === 0) {
        projectOptions.value = res.data.records
      }
    } finally {
      projectSearchLoading.value = false
    }
  }
}

const handleAdd = () => {
  dialogTitle.value = '新增商户'
  dialogVisible.value = true
  Object.assign(form, {
    id: undefined,
    name: '',
    category: '',
    projectId: undefined,
    address: '',
    phone: '',
    lat: undefined,
    lng: undefined,
    rating: 5
  })
  projectOptions.value = [] // 清空搜索缓存
}

const handleEdit = async (row: any) => {
  dialogTitle.value = '编辑商户'
  dialogVisible.value = true
  Object.assign(form, row)
  
  // 如果需要回显项目名称，这里可能需要额外逻辑
  // 暂时保持基础回显，Select会显示ID
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确认删除?', '提示').then(async () => {
    await deleteMerchantAPI(row.id)
    ElMessage.success('已删除')
    handleQuery()
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        if (form.id) {
          await updateMerchantAPI(form.id, form)
        } else {
          await addMerchantAPI(form)
        }
        ElMessage.success('保存成功')
        dialogVisible.value = false
        handleQuery()
      } catch (e) {
        // 错误由拦截器处理
      }
    }
  })
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped>
.app-container { padding: 20px; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>