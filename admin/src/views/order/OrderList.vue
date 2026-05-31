<template>
  <div class="order-list">
    <el-card>
      <div class="toolbar">
        <el-tabs v-model="activeStatus" @tab-change="onStatusChange">
          <el-tab-pane label="全部" name="all" />
          <el-tab-pane label="待支付" name="0" />
          <el-tab-pane label="已支付" name="1" />
          <el-tab-pane label="已发货" name="2" />
          <el-tab-pane label="已收货" name="3" />
          <el-tab-pane label="已取消" name="4" />
          <el-tab-pane label="已退货" name="5" />
        </el-tabs>
        <el-input v-model="orderNo" placeholder="搜索订单号" clearable style="width: 250px" @clear="fetch" @keyup.enter="fetch">
          <template #append>
            <el-button @click="fetch">搜索</el-button>
          </template>
        </el-input>
      </div>

      <el-table :data="orders" style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="orderNo" label="订单号" width="200" />
        <el-table-column prop="userId" label="用户ID" width="80" />
        <el-table-column label="商品" min-width="200">
          <template #default="{ row }">
            <div v-for="item in (row.orderItems || [])" :key="item.id" style="margin-bottom:2px">
              <span style="color:#606266">[{{ item.productId }}]</span> {{ item.productName }} x{{ item.quantity }}
            </div>
            <span v-if="!row.orderItems || row.orderItems.length === 0" style="color:#999">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="金额" width="120">
          <template #default="{ row }">&yen;{{ row.totalAmount }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="onDetail(row)">详情</el-button>
            <el-button size="small" type="primary" v-if="row.status === 1" @click="onShip(row)">发货</el-button>
            <el-button size="small" type="danger" v-if="row.status >= 1 && row.status <= 3" @click="onRefund(row)">退货</el-button>
          </template>
        </el-table-column>
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
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as orderApi from '@/api/order'

const router = useRouter()
const orders = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const activeStatus = ref('all')
const orderNo = ref('')

const statusLabel = (s: number) => {
  const map: Record<number, string> = { 0: '待支付', 1: '已支付', 2: '已发货', 3: '已收货', 4: '已取消', 5: '已退货' }
  return map[s] || '未知'
}

const statusType = (s: number) => {
  const map: Record<number, string> = { 0: 'warning', 1: 'success', 2: 'primary', 3: 'info', 4: 'danger', 5: 'danger' }
  return map[s] || 'info'
}

const fetch = async () => {
  const params: any = { page: page.value, size: size.value }
  if (activeStatus.value !== 'all') params.status = Number(activeStatus.value)
  if (orderNo.value) params.orderNo = orderNo.value

  const res = await orderApi.listOrders(params)
  const data = res.data
  orders.value = data.records || data.items || []
  total.value = data.total || 0
}

const onStatusChange = () => {
  page.value = 1
  fetch()
}

const onPageChange = (p: number) => {
  page.value = p
  fetch()
}

const onDetail = (row: any) => {
  router.push(`/order/${row.id}`)
}

const onShip = async (row: any) => {
  await ElMessageBox.confirm('确认发货此订单？', '提示')
  await orderApi.shipOrder(row.id)
  ElMessage.success('发货成功')
  fetch()
}

const onRefund = async (row: any) => {
  await ElMessageBox.confirm('确认对此订单进行退货？', '提示')
  await orderApi.refundOrder(row.id)
  ElMessage.success('退货成功')
  fetch()
}

onMounted(() => { fetch() })
</script>

<style scoped>
.order-list { padding: 0; }
.toolbar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
</style>
