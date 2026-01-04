<template>
  <div class="app-container">
    <el-card shadow="never" class="mb-4">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="项目名称">
          <el-input v-model="queryParams.name" placeholder="请输入名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="queryParams.city" placeholder="请输入城市" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button type="success" icon="Plus" @click="handleAdd">新增项目</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table v-loading="loading" :data="tableData" border style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="name" label="项目名称" min-width="120" />
      <el-table-column label="封面图" width="100" align="center">
        <template #default="{ row }">
          <el-image 
            :src="row.imageUrl" 
            :preview-src-list="[row.imageUrl]" 
            fit="cover" 
            style="width: 50px; height: 50px; border-radius: 4px;"
          >
            <template #error>
              <div class="image-slot">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
        </template>
      </el-table-column>
      <el-table-column prop="category" label="类别" width="120" />
      <el-table-column prop="city" label="城市" width="100" />
      <el-table-column prop="isIndoor" label="场所类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isIndoor === 1 ? 'info' : 'success'">
            {{ row.isIndoor === 1 ? '室内' : '室外' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" icon="Edit" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="warning" icon="Picture" @click="handleMedia(row)">媒体管理</el-button>
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
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入非遗项目名称" />
        </el-form-item>
        <el-form-item label="类别" prop="category">
          <el-input v-model="form.category" placeholder="如：传统美术" />
        </el-form-item>
        <el-form-item label="城市" prop="city">
          <el-input v-model="form.city" placeholder="如：广州市" />
        </el-form-item>
        <el-form-item label="封面图" prop="imageUrl">
          <el-upload
            action="/api/file/test/upload"
            :show-file-list="false"
            :on-success="handleCoverSuccess"
            class="avatar-uploader"
          >
            <img v-if="form.imageUrl" :src="form.imageUrl" class="avatar" style="width: 100px; height: 100px; display: block;" />
            <el-icon v-else class="avatar-uploader-icon" style="font-size: 28px; color: #8c939d; width: 100px; height: 100px; line-height: 100px; text-align: center; border: 1px dashed #d9d9d9;"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="地理位置">
          <MapPicker v-model:lat="form.lat" v-model:lng="form.lng" />
        </el-form-item>
        <el-form-item label="场所类型">
          <el-radio-group v-model="form.isIndoor">
            <el-radio :label="1">室内</el-radio>
            <el-radio :label="0">室外</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确 定</el-button>
      </template>
    </el-dialog>

    <ICIMedia ref="mediaRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getICHListAPI, addICHProjectAPI, updateICHProjectAPI, deleteICHProjectAPI } from '@/api/ich'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Picture } from '@element-plus/icons-vue'
import ICIMedia from '@/components/ICIMedia.vue'
import MapPicker from '@/components/MapPicker/index.vue'

// 状态定义
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const mediaRef = ref()
const formRef = ref()

const queryParams = reactive({
  current: 1,
  pageSize: 10,
  name: '',
  city: ''
})

const form = reactive({
  id: undefined,
  name: '',
  category: '',
  city: '',
  imageUrl: '',
  lat: undefined as number | undefined,
  lng: undefined as number | undefined,
  isIndoor: 1,
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  city: [{ required: true, message: '请输入城市', trigger: 'blur' }]
}

// 方法
const handleQuery = async () => {
  loading.value = true
  try {
    // 修复：这里加了 : any 类型断言，解决 AxiosResponse 上没有 code 属性的报错
    const res: any = await getICHListAPI(queryParams)
    if (res.code === 0) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  dialogTitle.value = '新增非遗项目'
  dialogVisible.value = true
  // 重置表单
  Object.assign(form, {
    id: undefined,
    name: '',
    category: '',
    city: '',
    imageUrl: '',
    lat: undefined,
    lng: undefined,
    isIndoor: 1,
    description: ''
  })
}

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑非遗项目'
  dialogVisible.value = true
  // 浅拷贝回填数据
  Object.assign(form, row)
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认删除 "${row.name}" 吗？`, '警告', {
    type: 'warning'
  }).then(async () => {
    await deleteICHProjectAPI(row.id)
    ElMessage.success('删除成功')
    handleQuery()
  })
}

const handleMedia = (row: any) => {
  mediaRef.value.open(row.id)
}

const handleCoverSuccess = (res: any) => {
  if (res.code === 0) {
    form.imageUrl = res.data
  } else {
    ElMessage.error('上传失败')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        if (form.id) {
          await updateICHProjectAPI(form.id, form)
          ElMessage.success('更新成功')
        } else {
          // 修复：这里通常也需要处理一下返回值
          const res: any = await addICHProjectAPI(form)
          if(res.code === 0) {
              ElMessage.success('新增成功')
          }
        }
        dialogVisible.value = false
        handleQuery()
      } catch (e) {
        // request.ts 会处理错误提示，这里可留空
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
.mb-4 { margin-bottom: 20px; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>