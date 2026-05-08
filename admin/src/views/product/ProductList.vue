<template>
  <div class="product-list">
    <el-card>
      <div class="toolbar" style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
        <el-input v-model="keyword" placeholder="搜索商品名称或编码" clearable @clear="onSearch" style="width:300px">
          <template #append>
            <el-button icon="el-icon-search" @click="onSearch"></el-button>
          </template>
        </el-input>

        <el-button type="primary" @click="onCreate">新增商品</el-button>
      </div>

      <el-table :data="products" style="width:100%">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="主图" width="100">
          <template #default="{ row }">
            <img :src="row.mainImage" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:4px" />
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="名称"/>
        <el-table-column prop="productCode" label="编码" width="140"/>
        <el-table-column prop="salePrice" label="价格" width="120">
          <template #default="{ row }">¥{{ row.salePrice }}</template>
        </el-table-column>
        <el-table-column prop="sellableStock" label="可售库存" width="120"/>
        <el-table-column prop="isOnline" label="上架" width="100">
          <template #default="{ row }">{{ row.isOnline === 1 ? '已上架' : '已下架' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="320">
          <template #default="{ row }">
            <el-button size="mini" @click="onEdit(row)">编辑</el-button>
            <el-button size="mini" type="success" v-if="row.isOnline !== 1" @click="onOnline(row)">上架</el-button>
            <el-button size="mini" type="warning" v-else @click="onOffline(row)">下架</el-button>
            <el-button size="mini" @click="openInventory(row)">库存</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination :total="total" :page.sync="page" :size.sync="size" @change="fetch" />
    </el-card>

    <el-dialog title="库存配置" :visible.sync="inventoryDialog.visible">
      <inventory-config v-if="inventoryDialog.product" :product="inventoryDialog.product" @ok="onInventoryOk" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as productApi from '@/api/product'
import Pagination from '@/components/Pagination.vue'
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
  products.value = data.data.items
  total.value = data.data.total
}

onMounted(() => {
  fetch()
})

const onSearch = () => {
  page.value = 1
  fetch()
}

const onCreate = () => {
  // navigate to edit page without id
  window.location.href = '/#/product/create'
}

const onEdit = (row: any) => {
  window.location.href = `/#/product/edit/${row.id}`
}

const onOnline = async (row: any) => {
  await productApi.onlineProduct(row.id)
  fetch()
}

const onOffline = async (row: any) => {
  await productApi.offlineProduct(row.id)
  fetch()
}

const openInventory = (row: any) => {
  inventoryDialog.value.product = row
  inventoryDialog.value.visible = true
}

const onInventoryOk = async (payload: any) => {
  inventoryDialog.value.visible = false
  // payload should contain productId and data
  await fetch()
}
</script>

<style scoped>
.product-list { padding: 20px }
.toolbar { margin-bottom: 12px }
</style>
