<script setup>
// 放弃专注时的温柔确认弹窗：随机碎碎念，绝不出现失败/未完成/扣分等负面词
import { ref, watch } from 'vue'
import ModalShell from './ModalShell.vue'
import { quip } from '../utils/quips'

const props = defineProps({
  visible: Boolean,
  canSave: Boolean, // 专注满 1 分钟才提供「记下来」选项，太短就不打扰记录
  elapsedText: String, // 已专注时长文案，如「12 分钟」
})
defineEmits(['close', 'save', 'discard'])

// 每次打开弹窗随机生成温柔文案
const heading = ref('没关系，先歇一歇')
const bodyText = ref('')
const shortBody = ref('')
watch(
  () => props.visible,
  (v) => {
    if (v) {
      heading.value = quip('abandonHeading')
      bodyText.value = quip('abandonBody')
      shortBody.value = quip('abandonShortBody')
    }
  }
)
</script>

<template>
  <ModalShell :visible="visible" @close="$emit('close')">
    <div class="text-center">
      <div class="mx-auto w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#639a78"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M12 20.5s-7.2-4.4-9.2-8.5C1.2 8.8 3 5.6 6.2 5.6c2.1 0 3.5 1.1 4.3 2.4h3c.8-1.3 2.2-2.4 4.3-2.4 3.2 0 5 3.2 3.4 6.4-2 4.1-9.2 8.5-9.2 8.5z"
          />
        </svg>
      </div>

      <h3 class="mt-4 text-base font-semibold">{{ heading }}</h3>

      <p v-if="canSave" class="mt-2 text-sm text-ink-600 leading-relaxed">
        你已经专注了 <span class="font-medium text-ink-900">{{ elapsedText }}</span
        >，<br />{{ bodyText }}
      </p>
      <p v-else class="mt-2 text-sm text-ink-600 leading-relaxed">{{ shortBody }}</p>

      <div class="mt-6 grid gap-2.5">
        <button v-if="canSave" class="btn-primary" @click="$emit('save')">记下来</button>
        <button class="btn-ghost" @click="$emit('discard')">
          {{ canSave ? '不用了，直接结束' : '好的' }}
        </button>
      </div>
    </div>
  </ModalShell>
</template>