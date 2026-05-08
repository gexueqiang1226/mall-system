<template>
  <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
    <el-form-item label="商品名称" prop="productName">
      <el-input v-model="form.productName" />
    </el-form-item>
    <el-form-item label="商品编码" prop="productCode">
      <el-input v-model="form.productCode" />
    </el-form-item>
    <el-form-item label="主图">
      <el-input v-model="form.mainImage" placeholder="图片 URL" />
    </el-form-item>
    <el-form-item label="价格" prop="salePrice">
      <el-input-number v-model="form.salePrice" :min="0" :step="0.01" />
    </el-form-item>
    <el-form-item label="可售库存" prop="sellableStock">
      <el-input-number v-model="form.sellableStock" :min="0" />
    </el-form-item>
    <el-form-item label="是否上架">
      <el-switch v-model="form.isOnline" active-value="1" inactive-value="0" />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="onSubmit">保存</el-button>
      <el-button @click="onCancel">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as productApi from '@/api/product'

const route = useRoute()
const router = useRouter()
const formRef = ref()

const form = ref<any>({
  productName: '',
  productCode: '',
  mainImage: '',
  salePrice: 0,
  sellableStock: 0,
  isOnline: 0,
})

const rules = {
  productName: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  salePrice: [{ required: true, message: '请输入价格', trigger: 'change' }],
}

const load = async (id: string) => {
  const res = await productApi.getProduct(Number(id))
  form.value = res.data
}

onMounted(() => {
  const id = (route.params as any).id
  if (id) {
    load(id as string)
  }
})

const onSubmit = async () => {
  await formRef.value.validate()
  const id = (route.params as any).id
  if (id) {
    await productApi.updateProduct(Number(id), form.value)
  } else {
    await productApi.createProduct(form.value)
  }
  router.push({ path: '/product' })
}

const onCancel = () => {
  router.back()
}
</script>

<style scoped>
</style>
