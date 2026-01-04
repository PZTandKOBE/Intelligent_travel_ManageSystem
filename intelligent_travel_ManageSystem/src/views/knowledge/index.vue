<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getKnowledgeListAPI, uploadKnowledgeAPI, deleteKnowledgeAPI, revectorizeAPI } from '@/api/knowledge'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadInstance } from 'element-plus'

// 数据定义
const tableData = ref([])
const total = ref(0)
const loading = ref(false) // 这是表格列表的 loading
const queryParams = reactive({
  current: 1,
  pageSize: 10,
  title: '',
  projectId: ''
})

// 上传相关
const uploadDialogVisible = ref(false)
const uploadRef = ref<UploadInstance>()
// 【新增】定义上传按钮的 loading 状态
const uploadLoading = ref(false)

const uploadForm = reactive({
  title: '',
  projectId: '',
  file: null as File | null
})

// 获取列表
const getList = async () => {
  loading.value = true
  try {
    const res = await getKnowledgeListAPI(queryParams)
    // 确保 res.data 存在
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

// 文件变动监听
const handleFileChange = (file: any) => {
  // 这里直接取 raw 即可，无需显式类型断言，避免报错
  uploadForm.file = file.raw
}

// 执行上传
const submitUpload = async () => {
  if (!uploadForm.file) {
    ElMessage.warning('请选择文件')
    return
  }
  if (!uploadForm.title) {
    ElMessage.warning('请输入文档标题')
    return
  }

  const fd = new FormData()
  fd.append('file', uploadForm.file)
  fd.append('title', uploadForm.title)
  // 如果填了关联项目ID
  if (uploadForm.projectId) {
    fd.append('projectId', uploadForm.projectId)
  }

  // 【修改】开启 loading，并使用 try...finally 确保 loading 必定关闭
  uploadLoading.value = true 

  try {
    // 这个 API 调用（假设你已经按照之前的建议修改了超时时间）
    await uploadKnowledgeAPI(fd)
    
    ElMessage.success('上传成功，后台正在向量化...')
    uploadDialogVisible.value = false
    
    // 重置表单
    uploadForm.title = ''
    uploadForm.projectId = ''
    uploadForm.file = null
    if (uploadRef.value) {
      uploadRef.value.clearFiles()
    }
    getList()
  } catch (error) {
    // 错误处理已在 request.ts 中，这里可以打个 log
    console.error('上传失败', error)
  } finally {
    // 【修改】无论成功还是失败，都关闭 loading 状态
    uploadLoading.value = false
  }
}

// 删除文档
const handleDelete = (row: any) => {
  ElMessageBox.confirm('确认删除该文档吗？删除后AI将无法检索该内容。', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteKnowledgeAPI(row.id)
    ElMessage.success('删除成功')
    getList()
  })
}

// 重新向量化
const handleRevectorize = async (row: any) => {
  try {
    await revectorizeAPI(row.id)
    ElMessage.success('已触发重新向量化任务')
  } catch(e) {}
}

onMounted(() => {
  getList()
})
</script>

<template>
  <div class="app-container" style="padding: 20px;">
    <el-card class="mb-20">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="文档标题">
          <el-input v-model="queryParams.title" placeholder="输入关键词搜索" clearable @keyup.enter="getList" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getList">查询</el-button>
          <el-button type="success" @click="uploadDialogVisible = true">上传新文档</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top: 20px;">
      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="title" label="文档标题" min-width="200" />
        <el-table-column prop="projectId" label="关联项目ID" width="120" align="center">
          <template #default="scope">
            {{ scope.row.projectId || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'completed' ? 'success' : 'warning'">
              {{ scope.row.status || '处理中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="上传时间" width="180" align="center" />
        
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleRevectorize(scope.row)">重算向量</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
        <el-pagination
          v-model:current-page="queryParams.current"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <el-dialog v-model="uploadDialogVisible" title="上传知识库文档" width="500px">
      <el-form label-position="top">
        <el-form-item label="文档标题" required>
          <el-input v-model="uploadForm.title" placeholder="例如：广绣技艺介绍.pdf" />
        </el-form-item>
        <el-form-item label="关联非遗项目 (选填)">
          <el-input v-model="uploadForm.projectId" placeholder="输入项目ID，例如：1" type="number" />
        </el-form-item>
        <el-form-item label="文件上传" required>
          <el-upload
            ref="uploadRef"
            action="#"
            class="upload-demo"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
          >
            <template #trigger>
              <el-button type="primary">选择文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                支持 .pdf, .txt, .doc 格式，文件将自动进行切片和向量化
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false" :disabled="uploadLoading">取消</el-button>
          
          <el-button 
            type="primary" 
            @click="submitUpload" 
            :loading="uploadLoading"
          >
            {{ uploadLoading ? '正在上传解析中...' : '开始上传' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>