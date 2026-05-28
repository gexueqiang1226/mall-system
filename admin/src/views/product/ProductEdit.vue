<template>
  <el-card style="max-width: 800px">
    <template #header>
      <span>{{ isEdit ? '编辑商品' : '新增商品' }}</span>
    </template>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
      <el-form-item label="商品名称" prop="productName">
        <el-input v-model="form.productName" placeholder="请输入商品名称" />
      </el-form-item>
      <el-form-item label="商品编码" prop="productCode">
        <el-input v-model="form.productCode" placeholder="请输入商品编码" :disabled="isEdit" />
      </el-form-item>
      <el-form-item label="分类ID">
        <el-input-number v-model="form.categoryId" :min="0" />
      </el-form-item>
      <el-form-item label="主图">
        <el-input v-model="form.mainImage" placeholder="图片 URL" />
      </el-form-item>
      <el-form-item label="商品描述">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入商品描述" />
      </el-form-item>
      <el-form-item label="售价" prop="salePrice">
        <el-input-number v-model="form.salePrice" :min="0" :precision="2" :step="1" />
      </el-form-item>
      <el-form-item label="市场价">
        <el-input-number v-model="form.marketPrice" :min="0" :precision="2" />
      </el-form-item>
      <el-form-item label="成本价">
        <el-input-number v-model="form.costPrice" :min="0" :precision="2" />
      </el-form-item>
      <el-form-item label="可售库存" prop="sellableStock">
        <el-input-number v-model="form.sellableStock" :min="0" />
      </el-form-item>
      <el-form-item label="是否上架">
        <el-switch v-model="form.isOnline" :active-value="1" :inactive-value="0" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="onSubmit" :loading="loading">保存</el-button>
        <el-button @click="onCancel">取消</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as productApi from '@/api/product'

const route = useRoute()
const router = useRouter()
const formRef = ref()
const loading = ref(false)

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  productName: '',
  productCode: '',
  categoryId: 0,
  mainImage: '',
  description: '',
  salePrice: 0,
  marketPrice: 0,
  costPrice: 0,
  sellableStock: 0,
  isOnline: 0,
})

const rules = {
  productName: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  productCode: [{ required: true, message: '请输入商品编码', trigger: 'blur' }],
  salePrice: [{ required: true, message: '请输入售价', trigger: 'change' }],
}

const load = async (id: string) => {
  const data = await productApi.getProduct(Number(id))
  const p = data.data
  if (p) {
    form.productName = p.productName || ''
    form.productCode = p.productCode || ''
    form.categoryId = p.categoryId || 0
    form.mainImage = p.mainImage || ''
    form.description = p.description || ''
    form.salePrice = p.salePrice || 0
    form.marketPrice = p.marketPrice || 0
    form.costPrice = p.costPrice || 0
    form.sellableStock = p.sellableStock || 0
    form.isOnline = p.isOnline || 0
  }
}

onMounted(() => {
  const id = (route.params as any).id
  if (id) {
    load(id as string)
  }
})

const onSubmit = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    const id = (route.params as any).id
    if (id) {
      await productApi.updateProduct(Number(id), { ...form })
    } else {
      await productApi.createProduct({ ...form })
    }
    ElMessage.success('保存成功')
    router.push({ path: '/product' })
  } finally {
    loading.value = false
  }
}

const onCancel = () => {
  router.back()
}
</script>

<style scoped>
</style>
