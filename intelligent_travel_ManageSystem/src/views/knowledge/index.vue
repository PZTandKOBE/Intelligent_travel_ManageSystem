<template>
  <div class="app-container">
    <el-card shadow="never" class="mb-4">
      <el-form :inline="true">
        <el-form-item label="文档标题">
          <el-input v-model="queryParams.title" placeholder="输入标题搜索" clearable @keyup.enter="fetchList" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="fetchList">搜索</el-button>
          <el-button type="success" icon="Upload" @click="dialogVisible = true">上传文档</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table v-loading="loading" :data="tableData" border>
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="title" label="文档标题" />
      <el-table-column prop="projectId" label="关联非遗ID" width="120" align="center" />
      <el-table-column prop="chunkCount" label="切片数" width="100" align="center" />
      <el-table-column prop="status" label="状态" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'completed' ? 'success' : 'warning'">
            {{ row.status === 'completed' ? '已完成' : '处理中' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="上传时间" width="180" />
      <el-table-column label="操作" width="250" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="handlePreview(row)">预览</el-button>
          <el-button 
            link 
            type="warning" 
            :loading="row.revectorizing" 
            @click="handleRevectorize(row)"
          >重算向量</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="queryParams.current"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

    <el-dialog title="上传知识库文档" v-model="dialogVisible" width="500px">
      <el-form :model="uploadForm" label-width="80px">
        <el-form-item label="文档标题">
          <el-input v-model="uploadForm.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="关联项目">
          <el-input v-model="uploadForm.projectId" placeholder="非遗项目ID (选填)" />
        </el-form-item>
        <el-form-item label="文件">
          <el-upload
            class="upload-demo"
            drag
            action="#"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-remove="() => { uploadForm.file = null }"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">拖拽文件到此处 或 <em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">支持 .txt, .pdf, .doc 格式</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="handleUpload">开始上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getKnowledgeListAPI, uploadKnowledgeAPI, deleteKnowledgeAPI, revectorizeKnowledgeAPI } from '@/api/knowledge'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const dialogVisible = ref(false)
const uploading = ref(false)

const queryParams = reactive({
  current: 1,
  pageSize: 10,
  title: ''
})

const uploadForm = reactive({
  title: '',
  projectId: '',
  file: null as any
})

const fetchList = async () => {
  loading.value = true
  try {
    // 修复：添加 : any 类型断言，解决 res.code 报错
    const res: any = await getKnowledgeListAPI(queryParams)
    if (res.code === 0) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const handleFileChange = (file: any) => {
  uploadForm.file = file.raw
}

const handleUpload = async () => {
  if (!uploadForm.file) {
    ElMessage.warning('请选择文件')
    return
  }
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', uploadForm.file)
    formData.append('title', uploadForm.title)
    if (uploadForm.projectId) {
      formData.append('projectId', uploadForm.projectId)
    }

    // 修复：添加 : any 类型断言
    const res: any = await uploadKnowledgeAPI(formData)
    if (res.code === 0) {
      ElMessage.success('上传成功，后台正在处理中...')
      dialogVisible.value = false
      fetchList()
    }
  } catch (error) {
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}

const handleRevectorize = async (row: any) => {
  row.revectorizing = true
  try {
    // 修复：添加 : any 类型断言（虽然这里没报错，但预防万一）
    const res: any = await revectorizeKnowledgeAPI(row.id)
    // 只有 code 为 0 才提示成功
    if (res.code === 0) {
      ElMessage.success('重算指令已发送')
    }
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    row.revectorizing = false
  }
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确认删除?', '提示').then(async () => {
    await deleteKnowledgeAPI(row.id)
    ElMessage.success('删除成功')
    fetchList()
  })
}

const handlePreview = (row: any) => {
  if (row.fileUrl) {
    window.open(row.fileUrl, '_blank')
  } else {
    ElMessage.warning('暂无文件地址')
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.app-container { padding: 20px; }
.pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }
</style>