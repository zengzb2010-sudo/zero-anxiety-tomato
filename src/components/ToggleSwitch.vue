<script setup>
// 开关组件（v-model:checked）
const props = defineProps({
  checked: Boolean,
})
const emit = defineEmits(['update:checked'])
function toggle() {
  emit('update:checked', !props.checked)
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="checked"
    class="relative w-12 h-7 rounded-full transition-colors shrink-0"
    :class="checked ? 'bg-sage-500' : 'bg-sand-200'"
    @click="toggle"
  >
    <span
      class="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform"
      :class="checked ? 'translate-x-5' : ''"
    />
  </button>
</template>