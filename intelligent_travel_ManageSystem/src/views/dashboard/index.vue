<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getDashboardStatsAPI } from '@/api/statistics'
import { 
  User, 
  ChatLineRound, 
  Position, 
  View 
} from '@element-plus/icons-vue'

// === 数据定义 ===
const loading = ref(false)
const statsData = ref({
  overview: {
    totalUsers: 0,
    activeUsersToday: 0,
    totalConversations: 0,
    totalRecommendations: 0
  }
})

// 图表 DOM 引用
const lineChartRef = ref<HTMLElement>()
const barChartRef = ref<HTMLElement>()
const pieChartRef = ref<HTMLElement>()

// 图表实例
let lineChart: echarts.ECharts | null = null
let barChart: echarts.ECharts | null = null
let pieChart: echarts.ECharts | null = null

// === 方法 ===

// 1. 初始化折线图 (流量趋势)
const initLineChart = (data: any) => {
  if (!lineChartRef.value) return
  lineChart = echarts.init(lineChartRef.value)
  
  const option = {
    title: { text: '近七日流量趋势', left: 'left' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['浏览量(PV)', '访客数(UV)'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: data.dates },
    yAxis: { type: 'value' },
    series: [
      {
        name: '浏览量(PV)',
        type: 'line',
        smooth: true,
        data: data.pv,
        itemStyle: { color: '#409EFF' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64,158,255,0.5)' },
            { offset: 1, color: 'rgba(64,158,255,0.01)' }
          ])
        }
      },
      {
        name: '访客数(UV)',
        type: 'line',
        smooth: true,
        data: data.uv,
        itemStyle: { color: '#67C23A' }
      }
    ]
  }
  lineChart.setOption(option)
}

// 2. 初始化柱状图 (热门项目)
const initBarChart = (data: any[]) => {
  if (!barChartRef.value) return
  barChart = echarts.init(barChartRef.value)

  const option = {
    title: { text: '热门非遗项目 Top5', left: 'center' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.map(i => i.name) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '咨询/浏览次数',
        type: 'bar',
        data: data.map(i => i.count),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        },
        barWidth: '40%'
      }
    ]
  }
  barChart.setOption(option)
}

// 3. 初始化饼图 (兴趣分布)
const initPieChart = (data: any[]) => {
  if (!pieChartRef.value) return
  pieChart = echarts.init(pieChartRef.value)

  const option = {
    title: { text: '用户兴趣类别分布', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '兴趣占比',
        type: 'pie',
        radius: '50%',
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  pieChart.setOption(option)
}

// 4. 获取数据并渲染
const fetchData = async () => {
  loading.value = true
  try {
    const res = await getDashboardStatsAPI()
    const { overview, trafficTrend, topProjects, interestDistribution } = res.data
    
    // 更新顶部卡片数字
    statsData.value.overview = overview
    
    // 渲染图表 (需在 DOM 更新后)
    await nextTick()
    initLineChart(trafficTrend)
    initBarChart(topProjects)
    initPieChart(interestDistribution)
  } catch (error) {
    console.error('获取统计数据失败', error)
  } finally {
    loading.value = false
  }
}

// 5. 窗口缩放自适应
const handleResize = () => {
  lineChart?.resize()
  barChart?.resize()
  pieChart?.resize()
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  lineChart?.dispose()
  barChart?.dispose()
  pieChart?.dispose()
})
</script>

<template>
  <div class="dashboard-container" v-loading="loading">
    <el-row :gutter="20" class="card-row">
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <div class="card-header">
            <span>总用户数</span>
            <el-icon class="icon-user"><User /></el-icon>
          </div>
          <div class="card-value">{{ statsData.overview.totalUsers.toLocaleString() }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <div class="card-header">
            <span>今日活跃 (DAU)</span>
            <el-icon class="icon-active"><View /></el-icon>
          </div>
          <div class="card-value">{{ statsData.overview.activeUsersToday.toLocaleString() }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <div class="card-header">
            <span>累计对话数</span>
            <el-icon class="icon-chat"><ChatLineRound /></el-icon>
          </div>
          <div class="card-value">{{ statsData.overview.totalConversations.toLocaleString() }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <div class="card-header">
            <span>智能推荐次数</span>
            <el-icon class="icon-rec"><Position /></el-icon>
          </div>
          <div class="card-value">{{ statsData.overview.totalRecommendations.toLocaleString() }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="chart-card">
      <div ref="lineChartRef" style="width: 100%; height: 350px;"></div>
    </el-card>

    <el-row :gutter="20" class="bottom-row">
      <el-col :span="12">
        <el-card shadow="never">
          <div ref="barChartRef" style="width: 100%; height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <div ref="pieChartRef" style="width: 100%; height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard-container {
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 84px);
}
.card-row {
  margin-bottom: 20px;
}
.data-card {
  height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #909399;
  font-size: 14px;
}
.card-value {
  font-size: 24px;
  font-weight: bold;
  margin-top: 10px;
  color: #303133;
}
/* 图标颜色 */
.icon-user { color: #409EFF; font-size: 20px; }
.icon-active { color: #67C23A; font-size: 20px; }
.icon-chat { color: #E6A23C; font-size: 20px; }
.icon-rec { color: #F56C6C; font-size: 20px; }

.chart-card {
  margin-bottom: 20px;
}
</style>