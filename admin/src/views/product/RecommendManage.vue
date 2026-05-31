<template>
  <el-card>
    <template #header>
      <span>人气推荐管理</span>
    </template>
    <el-form :inline="true" style="margin-bottom: 16px">
      <el-form-item label="搜索">
        <el-input v-model="keyword" placeholder="商品名称或编码" clearable style="width: 240px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadData">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="list" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="productName" label="商品名称" min-width="200" />
      <el-table-column prop="productCode" label="商品编码" width="140" />
      <el-table-column prop="salePrice" label="售价" width="100">
        <template #default="{ row }">¥{{ row.salePrice }}</template>
      </el-table-column>
      <el-table-column label="推荐状态" width="120">
        <template #default="{ row }">
          <el-switch
            v-model="row.isRecommend"
            :active-value="1"
            :inactive-value="0"
            @change="onToggle(row)"
          />
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-model:current-page="page"
      v-model:page-size="size"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      style="margin-top: 16px; justify-content: flex-end"
      @current-change="loadData"
      @size-change="loadData"
    />
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as productApi from '@/api/product'

const loading = ref(false)
const list = ref<any[]>([])
const page = ref(1)
const size = ref(20)
const total = ref(0)
const keyword = ref('')

const loadData = async () => {
  loading.value = true
  try {
    const res = await productApi.listProducts({
      page: page.value,
      size: size.value,
      keyword: keyword.value,
    })
    list.value = res.data.records || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

const onToggle = async (row: any) => {
  try {
    await productApi.updateProduct(row.id, { isRecommend: row.isRecommend })
    ElMessage.success('更新成功')
  } catch (err) {
    row.isRecommend = row.isRecommend === 1 ? 0 : 1
    ElMessage.error('更新失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
</style>
