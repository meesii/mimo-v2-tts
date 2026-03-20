<script setup>
import { useToast } from 'primevue/usetoast'
import { ref } from 'vue'
import AppNav from './components/AppNav.vue'
import AudioPlayer from './components/AudioPlayer.vue'
import TextEditor from './components/TextEditor.vue'
import { abort_speech, generate_speech } from './services/tts.js'

const toast = useToast()
const is_generating = ref(false)
const has_audio = ref(false)
const audio_text = ref('')
const audio_src = ref('')

/**
 * 关闭播放面板，生成中则中止请求
 */
const handle_player_close = () => {
    if (is_generating.value) {
        abort_speech()
        is_generating.value = false
    }
    has_audio.value = false
    audio_src.value = ''
}
/**
 * 调用 TTS API 生成语音
 * @param {string} text - 用户输入的文本（已包含 <style> 标签）
 * @param {string} voice - 音色标识
 */
const handle_generate = async (text, voice) => {
    audio_text.value = text
    is_generating.value = true
    has_audio.value = false
    audio_src.value = ''

    try {
        const { audio_data } = await generate_speech(text, voice)
        audio_src.value = `data:audio/wav;base64,${audio_data}`
        has_audio.value = true
    } catch (err) {
        if (err.name === 'AbortError') return
        toast.add({ severity: 'error', summary: '合成失败', detail: err.message, life: 5000 })
    } finally {
        is_generating.value = false
    }
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <div class="orb w-[500px] h-[500px] bg-primary-600 top-[-100px] right-[-100px]"></div>
    <div class="orb w-[600px] h-[600px] bg-primary-900 bottom-[-200px] left-[-100px]" style="animation-delay:-5s"></div>
    <div class="orb w-[400px] h-[400px] bg-primary-800 top-[20%] left-[10%]" style="animation-delay:-10s"></div>

    <AppNav />

    <main class="pt-20 sm:pt-24 pb-32 sm:pb-40 px-4 sm:px-6">
      <div class="max-w-4xl mx-auto">
        <header class="text-center mb-8 sm:mb-12 space-y-3 sm:space-y-4">
          <Tag rounded>
            <template #default>
              <span class="relative flex h-2 w-2 mr-2">
                <span class="animate-ping-dot absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              AI 语音合成引擎就绪
            </template>
          </Tag>
          <h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight font-headline text-color">
            文字，化为
            <span class="text-transparent bg-clip-text bg-linear-to-r from-primary to-primary-300">声音</span>
          </h1>
          <p class="text-sm sm:text-lg max-w-xl mx-auto text-muted-color">
            基于 MiMo TTS 引擎，将文本转化为自然流畅的语音。支持多音色切换与情感风格标签，轻松定制你的专属声音。
          </p>
        </header>

        <TextEditor @generate="handle_generate" :is-generating="is_generating" />
      </div>
    </main>

    <AudioPlayer
      v-if="has_audio || is_generating"
      :is-generating="is_generating"
      :preview-text="audio_text"
      :audio-src="audio_src"
      @close="handle_player_close"
    />

    <Toast position="bottom-center" />
  </div>
</template>
