<script setup>
// 通用弹层外壳：底部上滑卡片（移动端习惯），桌面端居中
defineProps({
  visible: Boolean,
})
defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay"
        @click.self="$emit('close')"
      >
        <Transition name="rise" appear>
          <div class="w-full max-w-md bg-surface rounded-t-3xl sm:rounded-3xl p-6 mx-auto">
            <slot />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.rise-enter-active,
.rise-leave-active {
  transition: transform 0.22s ease;
}
.rise-enter-from,
.rise-leave-to {
  transform: translateY(28px);
}
</style>