<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'

// props 接收初始坐标
const props = defineProps<{
  lat?: number
  lng?: number
  searchAddress?: string // 用于初始搜索的地址
}>()

const emit = defineEmits(['update:lat', 'update:lng', 'select'])

const mapContainer = ref<HTMLElement | null>(null)
let map: any = null
let marker: any = null

// 高德地图配置 (请替换为你自己的 Key)
const AMAP_KEY = '231e20c40715a74a88291615f7c0576f' 
// 如果使用 JS API 2.0 且没有配置代理，可能需要安全密钥，生产环境建议配置 Nginx 代理
const SECURITY_CODE = '231e20c40715a74a88291615f7c0576f' 

// 动态加载高德地图脚本
const loadMapScript = () => {
  return new Promise((resolve, reject) => {
    if ((window as any).AMap) {
      resolve((window as any).AMap)
      return
    }
    
    // 设置安全密钥 (JSAPI 2.0 必须)
    ;(window as any)._AMapSecurityConfig = {
      securityJsCode: SECURITY_CODE,
    }

    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}`
    script.onload = () => resolve((window as any).AMap)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// 初始化地图
const initMap = async () => {
  try {
    const AMap = await loadMapScript() as any
    
    // 默认中心点：广州 (如果没有传入坐标)
    const center = (props.lng && props.lat) ? [props.lng, props.lat] : [113.2644, 23.1291]
    
    map = new AMap.Map(mapContainer.value, {
      zoom: 13,
      center: center,
    })

    // 如果有初始坐标，添加标记
    if (props.lng && props.lat) {
      addMarker(props.lng, props.lat)
    }

    // 地图点击事件
    map.on('click', (e: any) => {
      const { lng, lat } = e.lnglat
      addMarker(lng, lat)
      emit('update:lng', lng)
      emit('update:lat', lat)
      emit('select', { lng, lat })
      ElMessage.success(`已选中坐标: ${lng.toFixed(6)}, ${lat.toFixed(6)}`)
    })

  } catch (error) {
    console.error('地图加载失败', error)
    ElMessage.error('地图加载失败，请检查 Key 配置')
  }
}

// 添加/移动标记
const addMarker = (lng: number, lat: number) => {
  const AMap = (window as any).AMap
  if (!marker) {
    marker = new AMap.Marker({
      position: [lng, lat],
      map: map
    })
  } else {
    marker.setPosition([lng, lat])
  }
}

// 监听 props 变化更新视图 (例如编辑模式打开时)
watch(() => [props.lng, props.lat], ([newLng, newLat]) => {
  if (newLng && newLat && map) {
    const AMap = (window as any).AMap
    if(AMap) {
       addMarker(newLng as number, newLat as number)
       map.setCenter([newLng, newLat])
    }
  }
})

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (map) {
    map.destroy()
  }
})
</script>

<template>
  <div class="map-picker-container">
    <div ref="mapContainer" class="map-container"></div>
    <div class="tips">
      <el-tag type="info" size="small">操作提示</el-tag>
      <span style="font-size: 12px; margin-left: 8px; color: #666;">
        点击地图任意位置即可选取坐标；滚动鼠标缩放地图。
      </span>
    </div>
  </div>
</template>

<style scoped>
.map-picker-container {
  width: 100%;
  height: 350px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  position: relative;
}
.map-container {
  width: 100%;
  height: 100%;
}
.tips {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 5px 10px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>