import request from '@/utils/request'

// 1. 获取商户分页列表
export function getMerchantListAPI(data: any) {
  return request({
    url: '/merchant/list',
    method: 'post',
    data
  })
}

// 2. 新增商户
export function addMerchantAPI(data: any) {
  return request({
    url: '/merchant/add',
    method: 'post',
    data
  })
}

// 3. 更新商户
export function updateMerchantAPI(id: number, data: any) {
  return request({
    url: `/merchant/update/${id}`,
    method: 'put',
    data
  })
}

// 4. 删除商户
export function deleteMerchantAPI(id: number) {
  return request({
    url: `/merchant/${id}`,
    method: 'delete'
  })
}

// 5. (可选) 获取所有非遗项目，用于下拉选择关联
// 复用 ich 模块的 API 即可，这里不需要单独写