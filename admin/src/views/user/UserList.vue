<template>
  <div class="user-list">
    <el-card>
      <div class="toolbar" style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
        <el-input v-model="keyword" placeholder="搜索用户名/手机号/邮箱" clearable @clear="onSearch" style="width:300px">
          <template #append>
            <el-button @click="onSearch">搜索</el-button>
          </template>
        </el-input>
      </div>

      <el-table :data="users" style="width:100%">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="onView(row)">查看</el-button>
            <el-button size="small" type="primary" @click="onEdit(row)">编辑</el-button>
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

    <el-dialog v-model="viewDialog.visible" title="用户详情" width="600px">
      <div v-if="viewDialog.user" style="line-height:2">
        <p><strong>ID:</strong> {{ viewDialog.user.id }}</p>
        <p><strong>用户名:</strong> {{ viewDialog.user.username }}</p>
        <p><strong>手机号:</strong> {{ viewDialog.user.phone }}</p>
        <p><strong>邮箱:</strong> {{ viewDialog.user.email }}</p>
        <p><strong>状态:</strong> {{ viewDialog.user.status === 1 ? '正常' : '禁用' }}</p>
        <p><strong>创建时间:</strong> {{ viewDialog.user.createdAt }}</p>
        <p><strong>更新时间:</strong> {{ viewDialog.user.updatedAt }}</p>
      </div>
      <template #footer>
        <el-button @click="viewDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialog.visible" title="编辑用户" width="600px" @close="onEditClose">
      <el-form v-if="editDialog.user" :model="editDialog.user" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="editDialog.user.username" disabled />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editDialog.user.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editDialog.user.email" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="editDialog.user.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="onEditSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as userApi from '@/api/user'

const users = ref<Array<any>>([])
const total = ref<number>(0)
const page = ref<number>(1)
const size = ref<number>(10)
const keyword = ref<string>('')

const viewDialog = ref({ visible: false, user: null as any })
const editDialog = ref({ visible: false, user: null as any })

const fetch = async () => {
  const res = await userApi.listUsers({ page: page.value, size: size.value, keyword: keyword.value })
  const data = res.data
  users.value = data.items || data.records || []
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

const onView = async (row: any) => {
  const res = await userApi.getUser(row.id)
  viewDialog.value.user = res.data
  viewDialog.value.visible = true
}

const onEdit = async (row: any) => {
  const res = await userApi.getUser(row.id)
  editDialog.value.user = { ...res.data }
  editDialog.value.visible = true
}

const onEditSave = async () => {
  const user = editDialog.value.user
  await userApi.updateUser(user.id, {
    phone: user.phone,
    email: user.email,
    status: user.status
  })
  ElMessage.success('更新成功')
  editDialog.value.visible = false
  fetch()
}

const onEditClose = () => {
  editDialog.value.user = null
}
</script>

<style scoped>
.user-list { padding: 20px }
.toolbar { margin-bottom: 12px }
</style>
