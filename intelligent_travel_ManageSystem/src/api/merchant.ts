import request from '@/utils/request'

export const getMerchantListAPI = (data: any) => {
  return request({
    url: '/merchant/list',
    method: 'post',
    data
  })
}

export const addMerchantAPI = (data: any) => {
  return request({
    url: '/merchant/add',
    method: 'post',
    data
  })
}

export const updateMerchantAPI = (id: number, data: any) => {
  return request({
    url: `/merchant/update/${id}`,
    method: 'put',
    data
  })
}

export const deleteMerchantAPI = (id: number) => {
  return request({
    url: `/merchant/${id}`,
    method: 'delete'
  })
}