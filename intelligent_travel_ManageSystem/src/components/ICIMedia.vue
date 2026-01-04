<template>
  <el-drawer
    v-model="visible"
    title="非遗项目 - 多媒体资源管理"
    size="50%"
    @open="fetchData"
  >
    <div class="media-container" v-loading="loading">
      <el-card shadow="never" class="mb-4">
        <template #header>
          <div class="card-header">
            <span>新增资源</span>
          </div>
        </template>
        <el-form :inline="true" :model="form" class="demo-form-inline">
          <el-form-item label="标题">
            <el-input v-model="form.title" placeholder="如：制作工艺展示" clearable />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="form.mediaType" placeholder="类型" style="width: 100px">
              <el-option label="图片" value="image" />
              <el-option label="视频" value="video" />
            </el-select>
          </el-form-item>
          <el-form-item>
             <el-upload
              class="upload-demo"
              action="/api/file/test/upload"
              :show-file-list="false"
              :on-success="handleUploadSuccess"
              :before-upload="beforeUpload"
              :on-error="handleUploadError"
            >
               <el-button type="primary" :loading="uploading" icon="Upload">上传并添加</el-button>
            </el-upload>
          </el-form-item>
        </el-form>
      </el-card>

      <el-table :data="mediaList" stripe style="width: 100%" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="预览" width="160">
          <template #default="{ row }">
            <el-image 
              v-if="row.mediaType === 'image'" 
              :src="row.mediaUrl" 
              :preview-src-list="[row.mediaUrl]"
              style="width: 120px; height: 80px; border-radius: 4px;" 
              fit="cover" 
            />
            <video 
              v-else 
              :src="row.mediaUrl" 
              style="width: 120px; height: 80px; border-radius: 4px;" 
              controls 
            />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="mediaType" label="类型" width="100">
           <template #default="{ row }">
             <el-tag :type="row.mediaType === 'video' ? 'warning' : 'success'">
               {{ row.mediaType === 'video' ? '视频' : '图片' }}
             </el-tag>
           </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" size="small" icon="Delete" circle @click="handleDelete(row.id)"></el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { getICHMediaListAPI, addICHMediaAPI, deleteICHMediaAPI } from '@/api/ich'
import { ElMessage, ElMessageBox } from 'element-plus'

const visible = ref(false)
const projectId = ref<number>(0)
const loading = ref(false)
const uploading = ref(false)
const mediaList = ref([])

const form = reactive({
  title: '',
  mediaType: 'image',
  mediaUrl: ''
})

// 对外暴露 open 方法
const open = (id: number) => {
  projectId.value = id
  visible.value = true
  // 重置表单
  form.title = ''
  form.mediaType = 'image'
  form.mediaUrl = ''
}

const fetchData = async () => {
  if (!projectId.value) return
  loading.value = true
  try {
    // 修复：添加 : any 类型断言，解决 res.code 报错
    const res: any = await getICHMediaListAPI(projectId.value)
    if (res.code === 0) {
      mediaList.value = res.data
    }
  } finally {
    loading.value = false
  }
}

const beforeUpload = () => {
  if (!form.title) {
    ElMessage.warning('请先填写标题')
    return false
  }
  uploading.value = true
  return true
}

const handleUploadError = () => {
  uploading.value = false
  ElMessage.error('文件上传失败，请检查网络或文件大小')
}

const handleUploadSuccess = async (response: any) => {
  uploading.value = false
  // 注意：根据后端API文档，返回结构是 { code: 0, data: "url_string", message: "ok" }
  if (response.code === 0) {
    const url = response.data
    try {
      // 修复：添加 : any 类型断言，确保 res.code 访问不报错
      const res: any = await addICHMediaAPI({
        projectId: projectId.value,
        mediaType: form.mediaType as 'image' | 'video',
        mediaUrl: url,
        title: form.title
      })
      
      if (res.code === 0) {
        ElMessage.success('添加成功')
        fetchData() // 刷新列表
        form.title = '' // 清空标题方便下一次
      }
    } catch (e) {
      ElMessage.error('保存媒体记录失败')
    }
  } else {
    ElMessage.error(response.message || '文件上传异常')
  }
}

const handleDelete = (id: number) => {
  ElMessageBox.confirm('确定删除该资源吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    // 修复：添加 : any 类型断言（虽然通常delete不检查返回值，但为了统一风格）
    await deleteICHMediaAPI(id)
    ElMessage.success('删除成功')
    fetchData()
  })
}

defineExpose({ open })
</script>

<style scoped>
.mb-4 { margin-bottom: 16px; }
.media-container { padding: 0 20px; }
</style>