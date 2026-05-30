<template>
  <div class="review-list">
    <el-card>
      <div class="toolbar" style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
        <el-input v-model="productId" placeholder="商品ID" clearable @clear="onSearch" style="width:150px">
          <template #append>
            <el-button @click="onSearch">搜索</el-button>
          </template>
        </el-input>

        <el-select v-model="rating" placeholder="评分筛选" clearable @change="onSearch" style="width:150px">
          <el-option label="1星" :value="1" />
          <el-option label="2星" :value="2" />
          <el-option label="3星" :value="3" />
          <el-option label="4星" :value="4" />
          <el-option label="5星" :value="5" />
        </el-select>
      </div>

      <el-table :data="reviews" style="width:100%">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="productId" label="商品ID" width="100" />
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column prop="rating" label="评分" width="150">
          <template #default="{ row }">
            <el-tag v-if="row.rating === 5" type="success">⭐⭐⭐⭐⭐</el-tag>
            <el-tag v-else-if="row.rating === 4" type="success">⭐⭐⭐⭐</el-tag>
            <el-tag v-else-if="row.rating === 3" type="warning">⭐⭐⭐</el-tag>
            <el-tag v-else-if="row.rating === 2" type="warning">⭐⭐</el-tag>
            <el-tag v-else type="danger">⭐</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="评价内容" min-width="300" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as reviewApi from '@/api/review'

const reviews = ref<Array<any>>([])
const total = ref<number>(0)
const page = ref<number>(1)
const size = ref<number>(10)
const productId = ref<string>('')
const rating = ref<number | undefined>(undefined)

const fetch = async () => {
  const params: any = { page: page.value, size: size.value }
  if (productId.value) params.productId = parseInt(productId.value)
  if (rating.value) params.rating = rating.value

  const res = await reviewApi.listReviews(params)
  const data = res.data
  reviews.value = data.items || data.records || []
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

const onDelete = async (row: any) => {
  await ElMessageBox.confirm(`确认删除该评价？此操作不可恢复！`, '警告', { type: 'warning' })
  await reviewApi.deleteReview(row.id)
  ElMessage.success('删除成功')
  fetch()
}
</script>

<style scoped>
.review-list { padding: 20px }
.toolbar { margin-bottom: 12px }
</style>
