<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getICHListAPI, addICHProjectAPI, updateICHProjectAPI, deleteICHProjectAPI } from '@/api/ich'
import { ElMessage, ElMessageBox } from 'element-plus'

// 表格数据
const tableData = ref([])
const total = ref(0)
const loading = ref(false)
const queryParams = reactive({
  current: 1,
  pageSize: 10,
  name: '',
  city: '',
  category: ''
})

// 弹窗表单
const dialogVisible = ref(false)
const dialogTitle = ref('新增项目')
const formRef = ref()
const formData = reactive({
  id: undefined as number | undefined,
  name: '',
  category: '',
  city: '广州市',
  description: '',
  imageUrl: '',
  lat: 23.1291,
  lng: 113.2644,
  isIndoor: 0
})

// 校验规则
const rules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  category: [{ required: true, message: '请输入类别', trigger: 'blur' }],
  city: [{ required: true, message: '请输入城市', trigger: 'blur' }]
}

// 获取列表
const getList = async () => {
  loading.value = true
  try {
    const res = await getICHListAPI(queryParams)
    if (res && res.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

// 打开新增
const handleAdd = () => {
  dialogTitle.value = '新增非遗项目'
  // 重置表单
  Object.assign(formData, {
    id: undefined,
    name: '',
    category: '',
    city: '广州市',
    description: '',
    imageUrl: '',
    lat: 23.1291,
    lng: 113.2644,
    isIndoor: 0
  })
  dialogVisible.value = true
}

// 打开编辑
const handleEdit = (row: any) => {
  dialogTitle.value = '编辑非遗项目'
  // 浅拷贝数据到表单
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        if (formData.id) {
          await updateICHProjectAPI(formData.id, formData)
          ElMessage.success('更新成功')
        } else {
          await addICHProjectAPI(formData)
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

// 删除
const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认删除项目 "${row.name}" 吗？`, '警告', {
    type: 'warning'
  }).then(async () => {
    await deleteICHProjectAPI(row.id)
    ElMessage.success('删除成功')
    getList()
  })
}

onMounted(() => getList())
</script>

<template>
  <div class="app-container" style="padding: 20px;">
    <el-card class="mb-20">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="名称">
          <el-input v-model="queryParams.name" placeholder="项目名称" clearable />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="queryParams.city" placeholder="城市" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getList">查询</el-button>
          <el-button type="success" @click="handleAdd">新增项目</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top: 20px;">
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="项目名称" width="150" />
        <el-table-column prop="category" label="类别" width="120" />
        <el-table-column prop="city" label="城市" width="100" />
        <el-table-column prop="isIndoor" label="场所类型" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.isIndoor === 1 ? 'primary' : 'success'">
              {{ scope.row.isIndoor === 1 ? '室内' : '室外' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip min-width="200" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="scope">
            <el-button size="small" type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div style="margin-top: 20px; text-align: right;">
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
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="formData.name" placeholder="例如：广绣" />
        </el-form-item>
        <el-form-item label="所属类别" prop="category">
          <el-input v-model="formData.category" placeholder="例如：传统美术" />
        </el-form-item>
        <el-form-item label="所在城市" prop="city">
          <el-input v-model="formData.city" />
        </el-form-item>
        <el-form-item label="场所类型">
          <el-radio-group v-model="formData.isIndoor">
            <el-radio :value="1">室内 (雨天推荐)</el-radio>
            <el-radio :value="0">室外</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
             <el-form-item label="经度 (Lng)">
               <el-input-number v-model="formData.lng" :precision="6" :step="0.0001" style="width: 100%" />
             </el-form-item>
          </el-col>
          <el-col :span="12">
             <el-form-item label="纬度 (Lat)">
               <el-input-number v-model="formData.lat" :precision="6" :step="0.0001" style="width: 100%" />
             </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="项目描述">
          <el-input type="textarea" v-model="formData.description" :rows="3" />
        </el-form-item>
        <el-form-item label="图片URL">
          <el-input v-model="formData.imageUrl" placeholder="输入COS图片链接" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>