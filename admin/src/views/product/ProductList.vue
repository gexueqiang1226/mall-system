<template>
  <div class="product-list">
    <el-card>
      <div class="toolbar" style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
        <el-input v-model="keyword" placeholder="搜索商品名称或编码" clearable @clear="onSearch" style="width:300px">
          <template #append>
            <el-button @click="onSearch">搜索</el-button>
          </template>
        </el-input>

        <el-button type="primary" @click="onCreate">新增商品</el-button>
      </div>

      <el-table :data="products" style="width:100%">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="主图" width="100">
          <template #default="{ row }">
            <img v-if="row.mainImage" :src="row.mainImage" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:4px" />
            <span v-else style="color:#999">暂无</span>
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="名称" />
        <el-table-column prop="productCode" label="编码" width="140" />
        <el-table-column prop="salePrice" label="价格" width="120">
          <template #default="{ row }">&yen;{{ row.salePrice }}</template>
        </el-table-column>
        <el-table-column prop="sellableStock" label="可售库存" width="120" />
        <el-table-column prop="isOnline" label="上架" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isOnline === 1 ? 'success' : 'info'">
              {{ row.isOnline === 1 ? '已上架' : '已下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="400">
          <template #default="{ row }">
            <el-button size="small" @click="onEdit(row)">编辑</el-button>
            <el-button size="small" type="success" v-if="row.isOnline !== 1" @click="onOnline(row)">上架</el-button>
            <el-button size="small" type="warning" v-else @click="onOffline(row)">下架</el-button>
            <el-button size="small" @click="openInventory(row)">库存</el-button>
            <el-button size="small" type="danger" @click="onDelete(row)">删除</el-button>
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

    <el-dialog v-model="inventoryDialog.visible" title="库存配置" width="500px" @close="onInventoryClose">
      <inventory-config
        v-if="inventoryDialog.product"
        :product="inventoryDialog.product"
        @ok="onInventoryOk"
        @cancel="onInventoryClose"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as productApi from '@/api/product'
import InventoryConfig from '@/views/product/InventoryConfig.vue'

const products = ref<Array<any>>([])
const total = ref<number>(0)
const page = ref<number>(1)
const size = ref<number>(10)
const keyword = ref<string>('')

const inventoryDialog = ref({ visible: false, product: null as any })

const fetch = async () => {
  const res = await productApi.listProducts({ page: page.value, size: size.value, keyword: keyword.value })
  const data = res.data
  products.value = data.items || data.records || []
  total.value = data.total || 0
}

onMounted(() => {
  fetch()
})

const onPageChange = (p: number) => {
  page.value = p
  fetch()
}

const onSearch = () => {
  page.value = 1
  fetch()
}

const onCreate = () => {
  window.location.href = '/#/product/create'
}

const onEdit = (row: any) => {
  window.location.href = `/#/product/edit/${row.id}`
}

const onOnline = async (row: any) => {
  await ElMessageBox.confirm(`确认上架商品「${row.productName}」？`, '提示')
  await productApi.onlineProduct(row.id)
  ElMessage.success('上架成功')
  fetch()
}

const onOffline = async (row: any) => {
  await ElMessageBox.confirm(`确认下架商品「${row.productName}」？`, '提示')
  await productApi.offlineProduct(row.id)
  ElMessage.success('下架成功')
  fetch()
}

const openInventory = (row: any) => {
  inventoryDialog.value.product = row
  inventoryDialog.value.visible = true
}

const onInventoryOk = async () => {
  inventoryDialog.value.visible = false
  ElMessage.success('库存更新成功')
  await fetch()
}

const onInventoryClose = () => {
  inventoryDialog.value.visible = false
  inventoryDialog.value.product = null
}

const onDelete = async (row: any) => {
  await ElMessageBox.confirm(`确认删除商品「${row.productName}」？此操作不可恢复！`, '警告', { type: 'warning' })
  await productApi.deleteProduct(row.id)
  ElMessage.success('删除成功')
  fetch()
}
</script>

<style scoped>
.product-list { padding: 20px }
.toolbar { margin-bottom: 12px }
</style>
