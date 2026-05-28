<template>
  <div class="category-list">
    <el-card>
      <div class="toolbar">
        <span style="font-size: 16px; font-weight: bold">分类管理</span>
        <el-button type="primary" @click="onCreate">新增分类</el-button>
      </div>

      <el-table :data="categories" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="categoryName" label="分类名称" />
        <el-table-column prop="parentId" label="父分类ID" width="100">
          <template #default="{ row }">{{ row.parentId || '顶级' }}</template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="onEdit(row)">编辑</el-button>
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

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑分类' : '新增分类'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="分类名称">
          <el-input v-model="form.categoryName" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="父分类ID">
          <el-input-number v-model="form.parentId" :min="0" placeholder="0表示顶级分类" style="width: 100%" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as categoryApi from '@/api/category'

const categories = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)

const form = reactive({
  categoryName: '',
  parentId: 0,
  sortOrder: 0,
  status: 1,
})

const fetch = async () => {
  const res = await categoryApi.listCategories({ page: page.value, size: size.value })
  const data = res.data
  categories.value = data.records || data.items || []
  total.value = data.total || 0
}

const onPageChange = (p: number) => {
  page.value = p
  fetch()
}

const onCreate = () => {
  editingId.value = null
  form.categoryName = ''
  form.parentId = 0
  form.sortOrder = 0
  form.status = 1
  dialogVisible.value = true
}

const onEdit = (row: any) => {
  editingId.value = row.id
  form.categoryName = row.categoryName
  form.parentId = row.parentId
  form.sortOrder = row.sortOrder
  form.status = row.status
  dialogVisible.value = true
}

const onSave = async () => {
  if (!form.categoryName) {
    ElMessage.warning('请输入分类名称')
    return
  }
  if (editingId.value) {
    await categoryApi.updateCategory(editingId.value, { ...form })
  } else {
    await categoryApi.createCategory({ ...form })
  }
  ElMessage.success('保存成功')
  dialogVisible.value = false
  fetch()
}

const onDelete = async (row: any) => {
  await ElMessageBox.confirm(`确认删除分类「${row.categoryName}」？`, '提示')
  await categoryApi.deleteCategory(row.id)
  ElMessage.success('删除成功')
  fetch()
}

onMounted(() => { fetch() })
</script>

<style scoped>
.category-list { padding: 0; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
</style>
