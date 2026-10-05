<script setup>
// 应用根组件：多页签（keep-alive 保留各页状态）+ 底部导航
// 计时逻辑放在 useTimer 模块级单例中，切换页签计时不会中断
import { ref, provide } from 'vue'
import TabBar from './components/TabBar.vue'
import FocusView from './views/FocusView.vue'
import TasksView from './views/TasksView.vue'
import StatsView from './views/StatsView.vue'
import CollectionView from './views/CollectionView.vue'
import SettingsView from './views/SettingsView.vue'

const tab = ref('focus')
// 供子页面切换页签（如首页跳转到任务页）
provide('setTab', (t) => {
  tab.value = t
})
</script>

<template>
  <div class="min-h-dvh">
    <KeepAlive>
      <FocusView v-if="tab === 'focus'" />
      <TasksView v-else-if="tab === 'tasks'" />
      <StatsView v-else-if="tab === 'stats'" />
      <CollectionView v-else-if="tab === 'collection'" />
      <SettingsView v-else />
    </KeepAlive>
    <TabBar :current="tab" @change="tab = $event" />
  </div>
</template>