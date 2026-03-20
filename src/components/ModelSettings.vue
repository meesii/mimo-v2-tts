<script setup>
import { ref, watch } from 'vue'
import { save_config, tts_config } from '../services/tts.js'

const props = defineProps({
    visible: { type: Boolean, default: false }
})
const emit = defineEmits(['update:visible'])

/**
 * 表单临时副本，避免未保存时污染全局配置
 */
const form = ref({ ...tts_config })

watch(() => props.visible, (val) => {
    if (val) form.value = { ...tts_config }
})

/**
 * 保存配置并关闭弹窗
 */
const handle_save = () => {
    Object.assign(tts_config, form.value)
    save_config()
    emit('update:visible', false)
}

const handle_cancel = () => {
    emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    header="模型设置"
    modal
    :style="{ width: '480px' }"
    :draggable="false"
  >
    <div class="flex flex-col gap-5">
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-muted-color">API 地址</label>
        <InputText
          v-model="form.api_url"
          placeholder="https://api.xiaomimimo.com/v1/chat/completions"
          fluid
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <label class="text-sm font-semibold text-muted-color">API Key</label>
          <a
            href="https://platform.xiaomimimo.com/"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs text-primary hover:underline"
          >获取 API Key →</a>
        </div>
        <Password
          v-model="form.api_key"
          placeholder="输入你的 API Key"
          :feedback="false"
          toggle-mask
          fluid
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-muted-color">模型</label>
        <InputText
          v-model="form.model"
          placeholder="mimo-v2-tts"
          fluid
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="取消" severity="secondary" text @click="handle_cancel" />
        <Button label="保存" @click="handle_save" />
      </div>
    </template>
  </Dialog>
</template>
