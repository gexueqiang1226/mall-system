<template>
  <div>
    <el-form :model="local" label-width="120px">
      <el-form-item label="可售库存">
        <el-input-number v-model="local.sellableStock" :min="0" />
      </el-form-item>
      <el-form-item label="预警值">
        <el-input-number v-model="local.lowStockWarning" :min="0" />
      </el-form-item>
      <el-form-item label="调整原因">
        <el-input v-model="local.reason" placeholder="填写调整原因" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onOk">确认</el-button>
        <el-button @click="onCancel">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, reactive } from 'vue'
import * as inventoryApi from '@/api/inventory'

const props = defineProps({ product: Object })
const emit = defineEmits(['ok', 'cancel'])

const local = reactive({
  sellableStock: (props.product as any).sellableStock || 0,
  lowStockWarning: (props.product as any).lowStockWarning || 0,
  reason: '',
})

const onOk = async () => {
  await inventoryApi.updateInventory((props.product as any).id, {
    sellableStock: local.sellableStock,
    lowStockWarning: local.lowStockWarning,
    reason: local.reason,
  })
  emit('ok', { productId: (props.product as any).id })
}

const onCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
</style>
