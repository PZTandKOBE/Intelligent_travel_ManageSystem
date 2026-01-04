<template>
  <div class="map-picker-trigger">
    <el-space>
      <el-input 
        :model-value="latVal" 
        placeholder="纬度 (Lat)" 
        style="width: 140px" 
        @input="(val) => updateValue('lat', val)" 
      />
      <el-input 
        :model-value="lngVal" 
        placeholder="经度 (Lng)" 
        style="width: 140px" 
        @input="(val) => updateValue('lng', val)" 
      />
      <el-button type="primary" icon="Location" @click="openMap">选择坐标</el-button>
    </el-space>

    <el-dialog
      v-model="dialogVisible"
      title="选择位置 (点击地图选点)"
      width="800px"
      append-to-body
      :close-on-click-modal="false"
      @opened="initMap"
    >
      <div id="map-container" style="width: 100%; height: 500px; position: relative;"></div>
      <template #footer>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>当前选中: {{ tempLat || '-' }}, {{ tempLng || '-' }}</span>
          <div>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="confirmSelect">确定</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps<{
  lat?: number | string
  lng?: number | string
}>()

const emits = defineEmits(['update:lat', 'update:lng'])

const latVal = ref(props.lat)
const lngVal = ref(props.lng)
const dialogVisible = ref(false)

// 地图相关变量
let map: any = null
let marker: any = null
const tempLat = ref<number | string>('')
const tempLng = ref<number | string>('')

watch(() => props.lat, (val) => latVal.value = val)
watch(() => props.lng, (val) => lngVal.value = val)

const updateValue = (type: 'lat' | 'lng', val: string | number) => {
  if (type === 'lat') {
    latVal.value = val
    emits('update:lat', Number(val))
  } else {
    lngVal.value = val
    emits('update:lng', Number(val))
  }
}

const openMap = () => {
  tempLat.value = latVal.value || ''
  tempLng.value = lngVal.value || ''
  dialogVisible.value = true
}

const initMap = () => {
  // @ts-ignore
  if (!window.AMap) {
    alert('请在 index.html 中引入高德地图 JS API: <script src="https://webapi.amap.com/maps?v=2.0&key=您的Key"><\/script>')
    return
  }
  
  // @ts-ignore
  if (!map) {
    // @ts-ignore
    map = new window.AMap.Map('map-container', {
      zoom: 12,
      center: [lngVal.value || 113.2644, latVal.value || 23.1291], // 默认广州
    })

    map.on('click', (e: any) => {
      tempLat.value = e.lnglat.getLat()
      tempLng.value = e.lnglat.getLng()
      updateMarker()
    })
  } else {
    // 如果已有值，定位过去
    if (latVal.value && lngVal.value) {
      tempLat.value = Number(latVal.value)
      tempLng.value = Number(lngVal.value)
      // @ts-ignore
      map.setCenter([tempLng.value, tempLat.value])
      updateMarker()
    }
  }
}

const updateMarker = () => {
  // @ts-ignore
  if (!marker) {
    // @ts-ignore
    marker = new window.AMap.Marker({
      // @ts-ignore
      position: [tempLng.value, tempLat.value],
      map: map
    })
  } else {
    // @ts-ignore
    marker.setPosition([tempLng.value, tempLat.value])
  }
}

const confirmSelect = () => {
  latVal.value = tempLat.value
  lngVal.value = tempLng.value
  emits('update:lat', Number(tempLat.value))
  emits('update:lng', Number(tempLng.value))
  dialogVisible.value = false
}

onUnmounted(() => {
  if (map) {
    map.destroy()
  }
})
</script>

<style scoped>
.map-picker-trigger {
  width: 100%;
}
</style>