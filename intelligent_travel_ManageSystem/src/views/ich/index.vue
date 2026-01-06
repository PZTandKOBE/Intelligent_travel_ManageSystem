<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// 1. 导入缺少的类型 UploadRequestOptions, UploadRawFile
import type { UploadUserFile, UploadProps, UploadRequestOptions, UploadRawFile } from 'element-plus'
import { Search, Plus, Edit, Delete, Picture as IconPicture } from '@element-plus/icons-vue'

import { 
  getICHListAPI, 
  addICHProjectAPI, 
  updateICHProjectAPI, 
  deleteICHProjectAPI 
} from '@/api/ich'
import { getMerchantListAPI, getMerchantsByProjectAPI } from '@/api/merchant' 
// import { uploadFileAPI } from '@/api/file'
import AMapLoader from '@amap/amap-jsapi-loader' 

// === ⚠️⚠️⚠️ 高德地图配置 ⚠️⚠️⚠️ ===
// 务必与 MapPicker 保持一致的 Web端(JSAPI) Key
const AMAP_KEY = 'ae49d6da7c2b2e512cfd0eee52a8e84a' 
const AMAP_SECURITY_CODE = 'b53b60a2ff86751a31550af6a570fc7b'

// === 1. 数据定义 ===
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const merchantOptions = ref<any[]>([]) 
const computedAddresses = reactive<Record<number | string, string>>({}) 

const queryParams = reactive({
  current: 1,
  pageSize: 10,
  name: '',
  city: '',
  category: ''
})

// === 项目编辑/新增 表单 ===
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
  openStatus: 'open',
  lat: undefined as number | undefined,
  lng: undefined as number | undefined,
  merchantIds: [] as number[] 
})

// 暂存封面文件
const coverFile = ref<File | null>(null)

// === 资源管理 (图片) ===
const mediaDialogVisible = ref(false)
const mediaSubmitLoading = ref(false)
const currentProjectId = ref<number | undefined>(undefined)
const currentProjectName = ref('')
const mediaFileList = ref<UploadUserFile[]>([])
const pendingDeleteIds = ref<string[]>([])

const categoryOptions = ['传统美术', '传统技艺', '传统戏剧', '传统舞蹈', '民俗']
const cityOptions = ['广州市', '佛山市', '深圳市', '东莞市']

const rules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择类别', trigger: 'change' }],
  city: [{ required: true, message: '请选择城市', trigger: 'change' }]
}

// === 2. 地图服务 ===
let geocoder: any = null

const initGeocoder = async () => {
  try {
    // 设置安全密钥
    (window as any)._AMapSecurityConfig = {
      securityJsCode: AMAP_SECURITY_CODE,
    }

    const AMap = await AMapLoader.load({
      key: AMAP_KEY,
      version: '2.0',
      plugins: ['AMap.Geocoder']
    })
    geocoder = new AMap.Geocoder()
    
    // 初始化完成后，如果列表已有数据，立即触发一次解析
    if (tableData.value.length > 0) {
      tableData.value.forEach(row => resolveAddress(row))
    }
  } catch (e) {
    console.error('地图加载失败', e)
  }
}

const resolveAddress = (row: any) => {
  if (computedAddresses[row.id]) return computedAddresses[row.id]
  if (row.lat && row.lng && geocoder) {
    // 占位
    if (!computedAddresses[row.id]) computedAddresses[row.id] = '定位中...'
    
    geocoder.getAddress([row.lng, row.lat], (status: string, result: any) => {
      if (status === 'complete' && result.regeocode) {
        computedAddresses[row.id] = result.regeocode.formattedAddress
      } else {
        computedAddresses[row.id] = '地址解析失败'
      }
    })
    return computedAddresses[row.id]
  }
  return row.city || '暂无位置信息'
}

// === 3. 核心业务逻辑 ===

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
    
    // 如果 geocoder 还没初始化，尝试初始化
    if (!geocoder) await initGeocoder()
    // 延迟解析，确保 geocoder 实例存在
    setTimeout(() => {
      if (geocoder) tableData.value.forEach(row => resolveAddress(row))
    }, 500)
  } finally {
    loading.value = false
  }
}

const getCoverImage = (row: any) => {
  if (row.imageUrl) return row.imageUrl
  if (row.mediaList && Array.isArray(row.mediaList) && row.mediaList.length > 0) {
    const img = row.mediaList.find((m: any) => m.mediaType === 'image')
    return img ? img.mediaUrl : ''
  }
  return ''
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
  coverFile.value = null 
  
  if (type === 'edit' && row) {
    Object.assign(formData, row)
    formData.openStatus = row.openStatus || 'open'
    if (!formData.imageUrl) {
      formData.imageUrl = getCoverImage(row)
    }

    try {
      const merchantsRes = await getMerchantsByProjectAPI(row.id)
      formData.merchantIds = merchantsRes.data ? merchantsRes.data.map((m: any) => m.id) : []
    } catch (e) {
      console.error('获取关联商户失败', e)
      formData.merchantIds = []
    }
  } else {
    formData.id = undefined
    formData.name = ''
    formData.category = ''
    formData.city = ''
    formData.description = ''
    formData.imageUrl = ''
    formData.isIndoor = 0
    formData.openStatus = 'open'
    formData.lat = undefined
    formData.lng = undefined
    formData.merchantIds = []
  }
}

const handleCoverChange: UploadProps['onChange'] = (uploadFile) => {
  if (uploadFile.raw) {
    coverFile.value = uploadFile.raw
    formData.imageUrl = URL.createObjectURL(uploadFile.raw)
  }
}

// 提交表单 (FormData 格式)
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      submitLoading.value = true
      try {
        const data = new FormData()
        
        data.append('name', formData.name || '')
        data.append('category', formData.category || '')
        data.append('description', formData.description || '')
        data.append('city', formData.city || '')
        data.append('openStatus', formData.openStatus || 'open')
        
        // 强制转字符串
        data.append('lat', formData.lat ? String(formData.lat) : '')
        data.append('lng', formData.lng ? String(formData.lng) : '')
        data.append('isIndoor', String(formData.isIndoor)) 
        
        const mIds = formData.merchantIds.length > 0 ? formData.merchantIds.join(',') : ''
        data.append('merchantIds', mIds)
        
        if (coverFile.value) {
          data.append('images', coverFile.value)
        }

        if (dialogType.value === 'add') {
          await addICHProjectAPI(data)
          ElMessage.success('新增成功')
        } else {
          await updateICHProjectAPI(formData.id!, data)
          ElMessage.success('更新成功')
        }
        dialogVisible.value = false
        getList()
      } catch (e: any) {
        console.error(e)
        ElMessage.error(e.message || '操作失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(
    `确定删除 "${row.name}" 吗？`,
    '警告',
    { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
  ).then(async () => {
    await deleteICHProjectAPI(row.id)
    ElMessage.success('删除成功')
    getList()
  })
}

// === 4. 资源管理逻辑 ===

const openMediaDialog = (row: any) => {
  currentProjectId.value = row.id
  currentProjectName.value = row.name
  mediaDialogVisible.value = true
  pendingDeleteIds.value = []
  
  if (row.mediaList && row.mediaList.length > 0) {
    mediaFileList.value = row.mediaList
      .filter((m: any) => m.mediaType === 'image')
      .map((m: any) => ({
        name: m.id,
        url: m.mediaUrl,
        id: m.id 
      }))
  } else {
    mediaFileList.value = []
  }
}

const handleMediaRemove: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
  const file = uploadFile as any
  if (file.id) {
    pendingDeleteIds.value.push(String(file.id))
  }
  mediaFileList.value = uploadFiles
}

// 修复 TS 报错的核心逻辑
const handleMediaUpload = async (options: UploadRequestOptions) => {
  // 类型断言：将 file 转换为 UploadRawFile，它包含 uid
  const file = options.file as UploadRawFile
  
  const newFile: UploadUserFile = {
    name: file.name,
    uid: file.uid, // 这里的 uid 现在可以正确访问了
    url: URL.createObjectURL(file), 
    raw: file,
    status: 'ready'
  }
  mediaFileList.value.push(newFile)
}

const handleMediaSubmit = async () => {
  if (!currentProjectId.value) return
  mediaSubmitLoading.value = true
  try {
    const data = new FormData()
    
    if (pendingDeleteIds.value.length > 0) {
      data.append('deleteMediaIds', pendingDeleteIds.value.join(','))
    }

    const newFiles = mediaFileList.value.filter((f: any) => !f.id && f.raw)
    newFiles.forEach(f => {
      data.append('images', f.raw as File)
    })

    if (pendingDeleteIds.value.length === 0 && newFiles.length === 0) {
      mediaDialogVisible.value = false
      mediaSubmitLoading.value = false
      return
    }

    await updateICHProjectAPI(currentProjectId.value, data)
    ElMessage.success('资源更新成功')
    mediaDialogVisible.value = false
    getList() 
  } catch (error) {
    console.error(error)
    ElMessage.error('更新失败')
  } finally {
    mediaSubmitLoading.value = false
  }
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
  initGeocoder()
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
              :src="getCoverImage(row)" 
              fit="cover"
              :preview-src-list="[getCoverImage(row)]" 
              preview-teleported
            >
              <template #error>
                <div class="image-slot"><el-icon><IconPicture /></el-icon></div>
              </template>
            </el-image>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="项目名称" min-width="200" show-overflow-tooltip />
        
        <el-table-column prop="category" label="类别" width="120" align="center">
          <template #default="{ row }">
            <el-tag>{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="城市/位置" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ computedAddresses[row.id] || row.city || '加载中...' }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="场所类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isIndoor ? 'warning' : 'success'" effect="plain">
              {{ row.isIndoor ? '室内' : '室外' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right" align="center">
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
            :auto-upload="false" 
            :on-change="handleCoverChange"
            accept="image/*"
          >
            <img v-if="formData.imageUrl" :src="formData.imageUrl" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="tips">点击上传新封面 (将在保存时提交)</div>
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
            <el-radio :label="0">室外</el-radio>
            <el-radio :label="1">室内</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="开放状态">
          <el-radio-group v-model="formData.openStatus">
            <el-radio label="open">开放</el-radio>
            <el-radio label="close">关闭</el-radio>
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

    <el-dialog v-model="mediaDialogVisible" :title="`资源管理 - ${currentProjectName}`" width="700px">
      <div style="margin-bottom: 10px; color: #666; font-size: 14px;">
        管理该非遗项目的图片资源。新上传的图片将在点击“保存更改”后提交。
      </div>
      
      <el-upload
        v-model:file-list="mediaFileList"
        action="#"
        list-type="picture-card"
        :auto-upload="false"
        :http-request="handleMediaUpload"
        :on-remove="handleMediaRemove"
        accept="image/*"
        multiple
      >
        <el-icon><Plus /></el-icon>
      </el-upload>
      
      <template #footer>
        <el-button @click="mediaDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="mediaSubmitLoading" @click="handleMediaSubmit">保存更改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.app-container {
  padding: 20px;
  background: #f0f2f5;
  min-height: calc(100vh - 84px);
}
.search-card { margin-bottom: 20px; }
.toolbar { margin-bottom: 20px; }
.pagination { margin-top: 20px; display: flex; justify-content: flex-end; }
.image-slot { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background: #f5f7fa; color: #909399; }
.avatar-uploader { border: 1px dashed #d9d9d9; border-radius: 6px; cursor: pointer; position: relative; overflow: hidden; width: 100px; height: 100px; display: flex; justify-content: center; align-items: center; }
.avatar-uploader:hover { border-color: #409EFF; }
.avatar-uploader-icon { font-size: 28px; color: #8c939d; }
.avatar { width: 100px; height: 100px; display: block; object-fit: cover; }
.tips { font-size: 12px; color: #999; margin-top: 5px; }
</style>