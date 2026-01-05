<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadRequestOptions } from 'element-plus'
import { Search, Plus, Edit, Delete, Picture as IconPicture } from '@element-plus/icons-vue'

import { 
  getICHListAPI, 
  addICHProjectAPI, 
  updateICHProjectAPI, 
  deleteICHProjectAPI 
} from '@/api/ich'
import { getMerchantListAPI } from '@/api/merchant' 
import { uploadFileAPI } from '@/api/file'
import ICIMedia from '@/components/ICIMedia.vue'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const merchantOptions = ref<any[]>([]) 

const queryParams = reactive({
  current: 1,
  pageSize: 10,
  name: '',
  city: '',
  category: ''
})

const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const submitLoading = ref(false)
const formRef = ref()

const formData = reactive({
  id: undefined as number | undefined,
  name: '',
  category: '',
  city: '',
  description: '',
  imageUrl: '',
  isIndoor: 0,
  lat: undefined as number | undefined,
  lng: undefined as number | undefined,
  merchantIds: [] as number[] 
})

const mediaDialogVisible = ref(false)
const currentProjectId = ref<number>(0)
const currentProjectName = ref('')

const categoryOptions = ['传统美术', '传统技艺', '传统戏剧', '传统舞蹈', '民俗']
const cityOptions = ['广州市', '佛山市', '深圳市', '东莞市']

const rules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择类别', trigger: 'change' }],
  city: [{ required: true, message: '请选择城市', trigger: 'change' }]
}

const getMerchantOptions = async () => {
  try {
    const res = await getMerchantListAPI({ current: 1, pageSize: 1000 })
    merchantOptions.value = res.data.records
  } catch (error) {
    console.error('获取商户列表失败', error)
  }
}

const getList = async () => {
  loading.value = true
  try {
    const res = await getICHListAPI(queryParams)
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
  queryParams.city = ''
  queryParams.category = ''
  handleSearch()
}

const openDialog = async (type: 'add' | 'edit', row?: any) => {
  await getMerchantOptions()

  dialogType.value = type
  dialogVisible.value = true
  
  if (type === 'edit' && row) {
    Object.assign(formData, row)
    formData.merchantIds = [] // 编辑暂不回显商户，需后端支持
  } else {
    formData.id = undefined
    formData.name = ''
    formData.category = ''
    formData.city = ''
    formData.description = ''
    formData.imageUrl = ''
    formData.isIndoor = 0
    formData.lat = undefined
    formData.lng = undefined
    formData.merchantIds = []
  }
}

const handleAvatarUpload = async (options: UploadRequestOptions) => {
  try {
    const data = new FormData()
    data.append('file', options.file)
    const res = await uploadFileAPI(data)
    formData.imageUrl = res.data
    ElMessage.success('封面上传成功')
  } catch (error) {
    ElMessage.error('上传失败')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitLoading.value = true
      try {
        const payload = {
          ...formData,
          merchantIds: formData.merchantIds.join(',') 
        }

        if (dialogType.value === 'add') {
          await addICHProjectAPI(payload)
          ElMessage.success('新增成功')
        } else {
          await updateICHProjectAPI(formData.id!, payload)
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
  ElMessageBox.confirm(
    `确定删除 "${row.name}" 吗？关联的商户可能无法正常展示。`,
    '警告',
    { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
  ).then(async () => {
    await deleteICHProjectAPI(row.id)
    ElMessage.success('删除成功')
    getList()
  })
}

const openMediaDialog = (row: any) => {
  currentProjectId.value = row.id
  currentProjectName.value = row.name
  mediaDialogVisible.value = true
}

const handleCurrentChange = (val: number) => {
  queryParams.current = val
  getList()
}
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val
  queryParams.current = 1
  getList()
}

onMounted(() => {
  getList()
})
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="项目名称">
          <el-input v-model="queryParams.name" placeholder="支持模糊搜索" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="类别">
          <el-select v-model="queryParams.category" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="城市">
          <el-select v-model="queryParams.city" placeholder="全部" clearable style="width: 140px">
            <el-option v-for="item in cityOptions" :key="item" :label="item" :value="item" />
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
        <el-button type="primary" :icon="Plus" @click="openDialog('add')">新增非遗项目</el-button>
      </div>

      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        
        <el-table-column label="封面" width="100" align="center">
          <template #default="{ row }">
            <el-image 
              style="width: 60px; height: 60px; border-radius: 4px;" 
              :src="row.imageUrl" 
              fit="cover"
              :preview-src-list="[row.imageUrl]" 
              preview-teleported
            >
              <template #error>
                <div class="image-slot"><el-icon><IconPicture /></el-icon></div>
              </template>
            </el-image>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="项目名称" min-width="120" />
        <el-table-column prop="category" label="类别" width="120" align="center">
          <template #default="{ row }">
            <el-tag>{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="city" label="城市" width="100" align="center" />
        
        <el-table-column label="场所类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isIndoor ? 'warning' : 'success'" effect="plain">
              {{ row.isIndoor ? '室内' : '室外' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="260" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="openDialog('edit', row)">编辑</el-button>
            <el-button link type="success" :icon="IconPicture" @click="openMediaDialog(row)">资源管理</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogType === 'add' ? '新增项目' : '编辑项目'" width="600px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="formData.name" placeholder="如：广绣" />
        </el-form-item>
        
        <el-form-item label="项目封面">
          <el-upload
            class="avatar-uploader"
            action="#"
            :show-file-list="false"
            :http-request="handleAvatarUpload"
            accept="image/*"
          >
            <img v-if="formData.imageUrl" :src="formData.imageUrl" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="tips">点击上传封面图，建议尺寸 1:1</div>
        </el-form-item>

        <el-form-item label="关联商户">
           <el-select 
              v-model="formData.merchantIds" 
              multiple 
              placeholder="请选择关联商户"
              style="width: 100%"
            >
              <el-option
                v-for="item in merchantOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
           </el-select>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="14">
            <el-form-item label="类别" prop="category">
              <el-select v-model="formData.category" style="width: 100%">
                <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="城市" prop="city">
              <el-select v-model="formData.city" style="width: 100%">
                <el-option v-for="c in cityOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="场所属性">
          <el-radio-group v-model="formData.isIndoor">
            <el-radio :label="0">室外 (适合晴天)</el-radio>
            <el-radio :label="1">室内 (适合雨天)</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="项目描述">
          <el-input v-model="formData.description" type="textarea" :rows="4" placeholder="请输入项目简介..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="mediaDialogVisible" :title="`资源管理 - ${currentProjectName}`" width="800px">
      <ICIMedia v-if="mediaDialogVisible" :project-id="currentProjectId" />
    </el-dialog>
  </div>
</template>

<style scoped>
.app-container {
  padding: 20px;
  background: #f0f2f5;
  min-height: calc(100vh - 84px);
}

.search-card {
  margin-bottom: 20px;
}

.toolbar {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
}

.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-uploader:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
  object-fit: cover;
}

.tips {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}
</style>