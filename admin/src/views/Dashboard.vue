<template>
  <div class="dashboard">
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">{{ stats.todayOrders }}</div>
            <div class="stat-label">今日订单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalOrders }}</div>
            <div class="stat-label">总订单数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">&yen;{{ formatAmount(stats.totalRevenue) }}</div>
            <div class="stat-label">总销售额</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalProducts }}</div>
            <div class="stat-label">商品总数 (上架: {{ stats.onlineProducts }})</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header><span>订单状态分布</span></template>
          <div ref="orderChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header><span>库存预警</span></template>
          <div class="warning-info">
            <el-alert
              v-if="stats.lowStockCount > 0"
              :title="`有 ${stats.lowStockCount} 件商品库存低于预警值`"
              type="warning"
              show-icon
              :closable="false"
              style="margin-bottom: 16px"
            />
            <el-empty v-else description="暂无库存预警" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import * as dashboardApi from '@/api/dashboard'

const stats = ref<any>({})
const orderChartRef = ref<HTMLElement>()

const statusLabels: Record<string, string> = {
  '0': '待支付',
  '1': '已支付',
  '2': '已发货',
  '3': '已收货',
  '4': '已取消',
  '5': '已退货',
}

const formatAmount = (val: number) => {
  if (!val) return '0.00'
  return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const loadStats = async () => {
  const res = await dashboardApi.getDashboardStats()
  stats.value = res.data || {}

  await nextTick()
  renderOrderChart()
}

const renderOrderChart = () => {
  if (!orderChartRef.value) return
  const chart = echarts.init(orderChartRef.value)
  const counts = stats.value.orderStatusCounts || {}
  const data = Object.entries(statusLabels).map(([key, name]) => ({
    name,
    value: counts[key] || 0,
  }))

  chart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data,
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' } },
    }],
  })
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard { padding: 0; }
.stat-card { text-align: center; padding: 10px 0; }
.stat-value { font-size: 28px; font-weight: bold; color: #409eff; }
.stat-label { font-size: 14px; color: #909399; margin-top: 8px; }
</style>
