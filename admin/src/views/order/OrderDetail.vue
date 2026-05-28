<template>
  <div class="order-detail" v-if="order">
    <el-page-header @back="goBack" title="返回" content="订单详情" style="margin-bottom: 20px" />

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card style="margin-bottom: 20px">
          <template #header><span>订单信息</span></template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ order.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag>{{ statusLabel(order.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="用户ID">{{ order.userId }}</el-descriptions-item>
            <el-descriptions-item label="总金额">&yen;{{ order.totalAmount }}</el-descriptions-item>
            <el-descriptions-item label="支付方式">{{ order.paymentMethod || '-' }}</el-descriptions-item>
            <el-descriptions-item label="备注">{{ order.remark || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ order.createTime }}</el-descriptions-item>
            <el-descriptions-item label="支付时间">{{ order.paymentTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="发货时间">{{ order.shippingTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="收货时间">{{ order.receiveTime || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card>
          <template #header><span>商品明细</span></template>
          <el-table :data="order.orderItems || []">
            <el-table-column prop="productId" label="商品ID" width="80" />
            <el-table-column prop="productName" label="商品名称" />
            <el-table-column prop="price" label="单价" width="120">
              <template #default="{ row }">&yen;{{ row.price }}</template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="totalAmount" label="小计" width="120">
              <template #default="{ row }">&yen;{{ row.totalAmount }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header><span>操作</span></template>
          <div style="display: flex; flex-direction: column; gap: 12px">
            <el-button type="primary" v-if="order.status === 1" @click="onShip">确认发货</el-button>
            <el-button type="danger" v-if="order.status >= 1 && order.status <= 3" @click="onRefund">退货处理</el-button>
            <el-empty v-if="order.status < 1 || order.status >= 4" description="无可用操作" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as orderApi from '@/api/order'

const route = useRoute()
const router = useRouter()
const order = ref<any>(null)

const statusLabel = (s: number) => {
  const map: Record<number, string> = { 0: '待支付', 1: '已支付', 2: '已发货', 3: '已收货', 4: '已取消', 5: '已退货' }
  return map[s] || '未知'
}

const load = async () => {
  const id = route.params.id
  const res = await orderApi.getOrder(Number(id))
  order.value = res.data
}

const goBack = () => router.push('/order')

const onShip = async () => {
  await ElMessageBox.confirm('确认发货？', '提示')
  await orderApi.shipOrder(order.value.id)
  ElMessage.success('发货成功')
  load()
}

const onRefund = async () => {
  await ElMessageBox.confirm('确认退货？', '提示')
  await orderApi.refundOrder(order.value.id)
  ElMessage.success('退货成功')
  load()
}

onMounted(() => { load() })
</script>

<style scoped>
.order-detail { padding: 0; }
</style>
