<template>
  <el-pagination
    :current-page="page"
    :page-size="size"
    :total="total"
    @current-change="onChange"
    layout="prev, pager, next, jumper, ->, total"
  />
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  size: { type: Number, default: 10 },
})

const emits = defineEmits(['update:page', 'update:size', 'change'])

const onChange = (newPage: number) => {
  emits('update:page', newPage)
  emits('change', newPage)
}
</script>
