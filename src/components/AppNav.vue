<script setup>
import { ref } from 'vue';
import ModelSettings from './ModelSettings.vue';

const show_settings = ref(false)
</script>

<template>
  <nav class="fixed top-0 w-full z-50 px-8 py-2.5 flex justify-between items-center glass-panel-strong border-b border-surface-700">
    <div class="flex items-center gap-2.5">
      <img src="/favicon.svg" alt="MiMo TTS" class="w-9 h-9" />
      <span class="text-xl font-bold tracking-tight text-primary font-headline">MiMo TTS</span>
      <Tag value="AI语音合成" class="ml-1 px-3 rounded-full" rounded />
    </div>

    <div class="flex items-center gap-1">
      <!-- <Button
        icon="pi pi-history"
        severity="secondary"
        text
        rounded
        v-tooltip.bottom="'历史记录'"
      /> -->
      <Button
        icon="pi pi-cog"
        severity="secondary"
        text
        rounded
        v-tooltip.bottom="'模型设置'"
        @click="show_settings = true"
      />
    </div>
  </nav>

  <ModelSettings v-model:visible="show_settings" />
</template>
