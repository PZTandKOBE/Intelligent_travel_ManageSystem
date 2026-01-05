<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type {  UploadProps, UploadUserFile } from 'element-plus'
import { Search, Upload, Refresh, Document } from '@element-plus/icons-vue'

// 引入 API
import { 
  getKnowledgeListAPI, 
  uploadKnowledgeAPI, 
  deleteKnowledgeAPI, 
  revectorizeKnowledgeAPI,
  updateKnowledgeAPI
} from '@/api/knowledge'
import { getICHListAPI } from '@/api/ich'

// === 数据定义 ===
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const projectOptions = ref<any[]>([]) // 非遗项目下拉选项

// 查询参数
const queryParams = reactive({
  current: 1,
  pageSize: 10,
  title: '',
  projectId: undefined as number | undefined
})

// 表单弹窗控制
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const submitLoading = ref(false)

// 表单数据
const formRef = ref()
const formData = reactive({
  id: undefined as number | undefined,
  title: '',
  projectId: undefined as number | undefined,
  file: null as File | null
})

// 上传组件引用
// const uploadRef = ref<UploadInstance>()
const fileList = ref<UploadUserFile[]>([])

// 表单校验规则
const rules = {
  title: [{ required: true, message: '请输入文档标题', trigger: 'blur' }],
  projectId: [{ required: true, message: '请选择关联非遗项目', trigger: 'change' }]
}

// === 方法实现 ===

// 1. 获取非遗项目列表（用于下拉框）
const getProjectList = async () => {
  try {
    // 获取所有项目用于筛选（pageSize 设大一点）
    const res = await getICHListAPI({ current: 1, pageSize: 100 })
    projectOptions.value = res.data.records
  } catch (error) {
    console.error('获取项目列表失败', error)
  }
}

// 2. 获取知识库列表
const getList = async () => {
  loading.value = true
  try {
    const res = await getKnowledgeListAPI(queryParams)
    tableData.value = res.data.records
    total.value = res.data.total
  } catch (error) {
    // 错误已被拦截器处理
  } finally {
    loading.value = false
  }
}

// 3. 处理搜索/重置
const handleSearch = () => {
  queryParams.current = 1
  getList()
}
const handleReset = () => {
  queryParams.title = ''
  queryParams.projectId = undefined
  handleSearch()
}

// 4. 打开新增/编辑弹窗
const openDialog = (type: 'add' | 'edit', row?: any) => {
  dialogType.value = type
  dialogVisible.value = true
  fileList.value = [] // 清空上传列表
  
  if (type === 'edit' && row) {
    formData.id = row.id
    formData.title = row.title
    formData.projectId = row.projectId
    // 编辑模式下，不强制要求重新上传文件，除非用户想替换
    formData.file = null 
  } else {
    // 新增模式重置表单
    formData.id = undefined
    formData.title = ''
    formData.projectId = undefined
    formData.file = null
  }
}

// 5. 文件变更监听
const handleFileChange: UploadProps['onChange'] = (uploadFile) => {
  if (uploadFile.raw) {
    formData.file = uploadFile.raw
    // 如果没有输入标题，自动填充文件名（去掉后缀）
    if (!formData.title) {
      const name = uploadFile.name
      formData.title = name.substring(0, name.lastIndexOf('.'))
    }
  }
  // 保持单文件上传
  if (fileList.value.length > 1) {
    fileList.value.splice(0, 1)
  }
}

// 6. 提交表单（上传/更新）
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      // 校验文件（新增必须有文件，编辑可选）
      if (dialogType.value === 'add' && !formData.file) {
        ElMessage.warning('请上传文档文件')
        return
      }

      submitLoading.value = true
      try {
        // 构建 FormData
        const payload = new FormData()
        payload.append('title', formData.title)
        if (formData.projectId) {
          payload.append('projectId', formData.projectId.toString())
        }
        if (formData.file) {
          payload.append('file', formData.file)
        }

        if (dialogType.value === 'add') {
          await uploadKnowledgeAPI(payload)
          ElMessage.success('上传成功，后台正在进行向量化处理...')
        } else {
          // 编辑
          if (formData.id) {
            await updateKnowledgeAPI(formData.id, payload)
            ElMessage.success('更新成功')
          }
        }
        
        dialogVisible.value = false
        getList()
      } catch (error) {
        // 错误处理
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 7. 删除文档
const handleDelete = (row: any) => {
  ElMessageBox.confirm(
    `确定要删除文档 "${row.title}" 吗？删除后相关的问答知识将失效。`,
    '警告',
    { type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消' }
  ).then(async () => {
    await deleteKnowledgeAPI(row.id)
    ElMessage.success('删除成功')
    getList()
  })
}

// 8. 重新向量化
const handleRevectorize = async (row: any) => {
  try {
    loading.value = true
    await revectorizeKnowledgeAPI(row.id)
    ElMessage.success('已触发重新向量化任务')
    getList() // 刷新状态
  } finally {
    loading.value = false
  }
}

// 9. 分页
const handleCurrentChange = (val: number) => {
  queryParams.current = val
  getList()
}

// 10. 状态字典映射
const getStatusTag = (status: string) => {
  const map: Record<string, { type: string, label: string }> = {
    'completed': { type: 'success', label: '已完成' },
    'processing': { type: 'warning', label: '处理中' },
    'failed': { type: 'danger', label: '失败' },
    'pending': { type: 'info', label: '等待中' }
  }
  return map[status] || { type: 'info', label: status || '未知' }
}

// 初始化
onMounted(() => {
  getProjectList()
  getList()
})
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="文档标题">
          <el-input v-model="queryParams.title" placeholder="请输入标题关键词" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="关联项目">
          <el-select v-model="queryParams.projectId" placeholder="选择关联项目" clearable style="width: 200px">
            <el-option
              v-for="item in projectOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <div class="toolbar">
        <el-button type="primary" :icon="Upload" @click="openDialog('add')">上传新文档</el-button>
      </div>

      <el-table v-loading="loading" :data="tableData" border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        
        <el-table-column label="文档信息" min-width="200">
          <template #default="{ row }">
            <div style="display: flex; align-items: center;">
              <el-icon class="mr-2"><Document /></el-icon>
              <span style="margin-left: 8px; font-weight: 500;">{{ row.title }}</span>
            </div>
            <div style="font-size: 12px; color: #999; margin-left: 24px;">
              文件名: {{ row.fileUrl ? row.fileUrl.split('/').pop() : '未知' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="关联项目" width="150" align="center">
          <template #default="{ row }">
            <el-tag effect="plain">{{ projectOptions.find(p => p.id === row.projectId)?.name || row.projectId }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="切片状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status).type as any">
              {{ getStatusTag(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="chunkCount" label="切片数" width="100" align="center" />
        
        <el-table-column prop="createdAt" label="上传时间" width="180" align="center" />

        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDialog('edit', row)">编辑</el-button>
            <el-button link type="warning" @click="handleRevectorize(row)">重新向量化</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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
          @size-change="handleSearch"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '上传文档' : '编辑文档'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="文档标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入文档展示标题" />
        </el-form-item>
        
        <el-form-item label="关联项目" prop="projectId">
          <el-select v-model="formData.projectId" placeholder="请选择关联非遗项目" style="width: 100%">
            <el-option
              v-for="item in projectOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="文档文件" :required="dialogType === 'add'">
          <el-upload
            ref="uploadRef"
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="fileList"
            :limit="1"
            accept=".pdf,.doc,.docx,.txt,.md"
          >
            <template #trigger>
              <el-button type="primary">选择文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                支持 PDF/Word/TXT/Markdown，上传后系统将自动切片并向量化。
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            {{ dialogType === 'add' ? '开始上传' : '保存修改' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.app-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 84px);
}
.search-card {
  margin-bottom: 20px;
}
.table-card {
  min-height: 500px;
}
.toolbar {
  margin-bottom: 20px;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>