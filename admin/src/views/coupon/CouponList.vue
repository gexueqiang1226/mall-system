<template>
  <div class="coupon-list">
    <el-card>
      <div class="toolbar" style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
        <el-input v-model="keyword" placeholder="搜索优惠券标题" clearable @clear="onSearch" style="width:300px">
          <template #append>
            <el-button @click="onSearch">搜索</el-button>
          </template>
        </el-input>

        <el-select v-model="status" placeholder="状态筛选" clearable @change="onSearch" style="width:150px">
          <el-option label="启用" :value="0" />
          <el-option label="已过期" :value="1" />
          <el-option label="停用" :value="2" />
        </el-select>

        <el-button type="primary" @click="onCreate">新增优惠券</el-button>
      </div>

      <el-table :data="coupons" style="width:100%">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="title" label="标题" width="200" />
        <el-table-column prop="minAmount" label="门槛金额" width="120">
          <template #default="{ row }">&yen;{{ row.minAmount }}</template>
        </el-table-column>
        <el-table-column prop="discountAmount" label="优惠金额" width="120">
          <template #default="{ row }">&yen;{{ row.discountAmount }}</template>
        </el-table-column>
        <el-table-column prop="discountType" label="类型" width="100" />
        <el-table-column prop="totalStock" label="库存" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 0" type="success">启用</el-tag>
            <el-tag v-else-if="row.status === 1" type="info">已过期</el-tag>
            <el-tag v-else-if="row.status === 2" type="danger">停用</el-tag>
            <el-tag v-else type="info">已删除</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="有效期" width="200">
          <template #default="{ row }">
            {{ row.startTime }} ~ {{ row.endTime }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="{ row }">
            <el-button size="small" @click="onEdit(row)">编辑</el-button>
            <el-button size="small" type="success" v-if="row.status === 2" @click="onEnable(row)">启用</el-button>
            <el-button size="small" type="warning" v-if="row.status === 0" @click="onDisable(row)">停用</el-button>
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

    <el-dialog v-model="formDialog.visible" :title="formDialog.isEdit ? '编辑优惠券' : '新增优惠券'" width="700px" @close="onFormClose">
      <el-form v-if="formDialog.coupon" :model="formDialog.coupon" label-width="120px">
        <el-form-item label="标题">
          <el-input v-model="formDialog.coupon.title" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formDialog.coupon.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="门槛金额">
          <el-input-number v-model="formDialog.coupon.minAmount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="优惠金额">
          <el-input-number v-model="formDialog.coupon.discountAmount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="类型">
          <el-input v-model="formDialog.coupon.discountType" placeholder="如: 满减券" />
        </el-form-item>
        <el-form-item label="总库存">
          <el-input-number v-model="formDialog.coupon.totalStock" :min="0" />
        </el-form-item>
        <el-form-item label="每人限领">
          <el-input-number v-model="formDialog.coupon.perUserLimit" :min="1" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="formDialog.coupon.startTime" type="datetime" placeholder="选择开始时间" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="formDialog.coupon.endTime" type="datetime" placeholder="选择结束时间" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="onFormSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as couponApi from '@/api/coupon'

const coupons = ref<Array<any>>([])
const total = ref<number>(0)
const page = ref<number>(1)
const size = ref<number>(10)
const keyword = ref<string>('')
const status = ref<number | undefined>(undefined)

const formDialog = ref({ visible: false, isEdit: false, coupon: null as any })

const fetch = async () => {
  const res = await couponApi.listCoupons({
    page: page.value,
    size: size.value,
    keyword: keyword.value,
    status: status.value
  })
  const data = res.data
  coupons.value = data.items || data.records || []
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
  formDialog.value.coupon = {
    title: '',
    description: '',
    minAmount: 0,
    discountAmount: 0,
    discountType: '满减券',
    totalStock: 100,
    perUserLimit: 1,
    startTime: '',
    endTime: ''
  }
  formDialog.value.isEdit = false
  formDialog.value.visible = true
}

const onEdit = async (row: any) => {
  const res = await couponApi.getCoupon(row.id)
  formDialog.value.coupon = { ...res.data }
  formDialog.value.isEdit = true
  formDialog.value.visible = true
}

const onFormSave = async () => {
  const coupon = formDialog.value.coupon
  if (formDialog.value.isEdit) {
    await couponApi.updateCoupon(coupon.id, coupon)
    ElMessage.success('更新成功')
  } else {
    await couponApi.createCoupon(coupon)
    ElMessage.success('创建成功')
  }
  formDialog.value.visible = false
  fetch()
}

const onFormClose = () => {
  formDialog.value.coupon = null
}

const onEnable = async (row: any) => {
  await ElMessageBox.confirm(`确认启用优惠券「${row.title}」？`, '提示')
  await couponApi.enableCoupon(row.id)
  ElMessage.success('启用成功')
  fetch()
}

const onDisable = async (row: any) => {
  await ElMessageBox.confirm(`确认停用优惠券「${row.title}」？`, '提示')
  await couponApi.disableCoupon(row.id)
  ElMessage.success('停用成功')
  fetch()
}

const onDelete = async (row: any) => {
  await ElMessageBox.confirm(`确认删除优惠券「${row.title}」？此操作不可恢复！`, '警告', { type: 'warning' })
  await couponApi.deleteCoupon(row.id)
  ElMessage.success('删除成功')
  fetch()
}
</script>

<style scoped>
.coupon-list { padding: 20px }
.toolbar { margin-bottom: 12px }
</style>
