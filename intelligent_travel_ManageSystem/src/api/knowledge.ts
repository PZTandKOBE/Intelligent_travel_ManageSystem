import request from '@/utils/request'

export const getKnowledgeListAPI = (data: any) => {
  return request({
    url: '/knowledge/list',
    method: 'post',
    data
  })
}

export const uploadKnowledgeAPI = (formData: FormData) => {
  return request({
    url: '/knowledge/upload',
    method: 'post',
    headers: { 'Content-Type': 'multipart/form-data' },
    data: formData
  })
}

export const deleteKnowledgeAPI = (id: number) => {
  return request({
    url: `/knowledge/${id}`,
    method: 'delete'
  })
}

export const revectorizeAPI = (id: number) => {
  return request({
    url: `/knowledge/revectorize/${id}`,
    method: 'post'
  })
}