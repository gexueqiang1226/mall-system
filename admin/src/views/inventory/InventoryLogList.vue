<template>
  <div class="inventory-log">
    <el-card>
      <div class="toolbar">
        <span style="font-size: 16px; font-weight: bold">库存变更日志</span>
        <div style="display: flex; gap: 12px">
          <el-input v-model="productId" placeholder="按商品ID筛选" clearable style="width: 200px" @clear="fetch" @keyup.enter="fetch" />
          <el-button type="primary" @click="fetch">查询</el-button>
        </div>
      </div>

      <el-table :data="logs" style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="商品" min-width="180">
          <template #default="{ row }">{{ row.productName || '-' }}<span v-if="row.productName" style="color:#999;margin-left:4px">[ID:{{ row.productId }}]</span></template>
        </el-table-column>
        <el-table-column prop="orderId" label="订单ID" width="80">
          <template #default="{ row }">{{ row.orderId || '-' }}</template>
        </el-table-column>
        <el-table-column prop="operationType" label="操作类型" width="100">
          <template #default="{ row }">
            <el-tag :type="opTypeColor(row.operationType)">{{ row.operationType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantityChange" label="变化数量" width="100" />
        <el-table-column prop="reason" label="原因" />
        <el-table-column prop="stockBefore" label="变更前" width="80" />
        <el-table-column prop="stockAfter" label="变更后" width="80" />
        <el-table-column prop="operateTime" label="操作时间" width="170" />
      </el-table>

      <el-pagination
        style="margin-top: 16px; text-align: right"
        :current-page="page"
        :page-size="size"
        :total="total"
        @current-change="onPageChange"
        layout="prev, pager, next, total"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as inventoryApi from '@/api/inventory'

const logs = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const productId = ref('')

const opTypeColor = (type: string) => {
  const map: Record<string, string> = { increase: 'success', decrease: 'danger', lock: 'warning', unlock: 'info', confirm: 'primary', refund: 'success' }
  return map[type] || 'info'
}

const fetch = async () => {
  const params: any = { page: page.value, size: size.value }
  if (productId.value) params.productId = Number(productId.value)
  const res = await inventoryApi.getInventoryLogs(Number(productId.value) || undefined, page.value, size.value)
  const data = res.data
  logs.value = data.records || data.items || []
  total.value = data.total || 0
}

const onPageChange = (p: number) => {
  page.value = p
  fetch()
}

onMounted(() => { fetch() })
</script>

<style scoped>
.inventory-log { padding: 0; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
</style>
