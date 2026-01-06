import request from '@/utils/request'

// 分页查询商户
export const getMerchantListAPI = (data: any) => {
  return request({
    url: '/merchant/list',
    method: 'POST',
    data
  })
}

// 根据非遗项目ID查询关联商户 (新增，用于编辑回显)
export const getMerchantsByProjectAPI = (projectId: number) => {
  return request({
    url: `/merchant/project/${projectId}`,
    method: 'GET'
  })
}

// 新增商户
export const addMerchantAPI = (data: any) => {
  return request({
    url: '/merchant/add',
    method: 'POST',
    data
  })
}

// 更新商户
export const updateMerchantAPI = (id: number, data: any) => {
  return request({
    url: `/merchant/update/${id}`,
    method: 'PUT',
    data
  })
}

// 删除商户
export const deleteMerchantAPI = (id: number) => {
  return request({
    url: `/merchant/${id}`,
    method: 'DELETE'
  })
}