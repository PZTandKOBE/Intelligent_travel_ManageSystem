import request from '@/utils/request'

export const getICHListAPI = (data: any) => {
  return request({
    url: '/ich/project/list',
    method: 'post',
    data
  })
}

export const addICHProjectAPI = (data: any) => {
  return request({
    url: '/ich/project/add',
    method: 'post',
    data
  })
}

export const updateICHProjectAPI = (id: number, data: any) => {
  return request({
    url: `/ich/project/update/${id}`,
    method: 'put',
    data
  })
}

export const deleteICHProjectAPI = (id: number) => {
  return request({
    url: `/ich/project/${id}`,
    method: 'delete'
  })
}