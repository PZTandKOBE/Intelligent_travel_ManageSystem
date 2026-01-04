import request from '@/utils/request'

// 获取文档列表
export const getKnowledgeListAPI = (data: any) => {
  return request({
    url: '/knowledge/list',
    method: 'post',
    data
  })
}

// 上传文档
export const uploadKnowledgeAPI = (formData: FormData) => {
  return request({
    url: '/knowledge/upload',
    method: 'post',
    timeout: 60000, // 可选：增加超时时间，防止大文件上传超时
    data: formData,
    // 关键点：让 axios 自动处理 Content-Type，避免 boundary 丢失错误
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 删除文档
export const deleteKnowledgeAPI = (id: number) => {
  return request({
    url: `/knowledge/${id}`,
    method: 'delete'
  })
}

// 重新向量化
export const revectorizeAPI = (id: number) => {
  return request({
    url: `/knowledge/revectorize/${id}`,
    method: 'post'
  })
}