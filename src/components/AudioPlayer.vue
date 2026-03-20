<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
    isGenerating: { type: Boolean, default: false },
    previewText: { type: String, default: '' },
    audioSrc: { type: String, default: '' },
})

const emit = defineEmits(['close'])

const is_playing = ref(false)
const progress = ref(0)
const current_time = ref('00:00')
const total_time = ref('00:00')
const volume = ref(80)

/** @type {HTMLAudioElement|null} */
let audio_el = null
let raf_id = null

const preview_snippet = computed(() => {
    const t = props.previewText.trim()
    if (!t) return '"等待合成…"'
    const plain = t.replace(/<[^>]+>/g, '').trim()
    return '"' + (plain.length > 32 ? plain.slice(0, 32) + '…' : plain) + '"'
})

const volume_icon = computed(() => {
    if (volume.value === 0) return 'pi pi-volume-off'
    if (volume.value < 50) return 'pi pi-volume-down'
    return 'pi pi-volume-up'
})

/**
 * 格式化秒数为 mm:ss
 * @param {number} sec
 * @returns {string}
 */
function format_time(sec) {
    if (!sec || !isFinite(sec)) return '00:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * 实时更新进度条和时间显示
 */
function update_progress() {
    if (!audio_el) return
    current_time.value = format_time(audio_el.currentTime)
    total_time.value = format_time(audio_el.duration)
    progress.value = audio_el.duration
        ? (audio_el.currentTime / audio_el.duration) * 100
        : 0
    if (is_playing.value) {
        raf_id = requestAnimationFrame(update_progress)
    }
}

/**
 * 当音频源变化时重新加载
 */
watch(() => props.audioSrc, (src) => {
    cleanup_audio()
    if (!src) return

    audio_el = new Audio(src)
    audio_el.volume = volume.value / 100

    audio_el.addEventListener('loadedmetadata', () => {
        total_time.value = format_time(audio_el.duration)
    })
    audio_el.addEventListener('canplaythrough', () => {
        audio_el.play()
        is_playing.value = true
        update_progress()
    }, { once: true })
    audio_el.addEventListener('ended', () => {
        is_playing.value = false
        progress.value = 100
        if (raf_id) cancelAnimationFrame(raf_id)
    })
})

watch(volume, (val) => {
    if (audio_el) audio_el.volume = val / 100
})

/**
 * 拖动进度条时跳转播放位置
 */
watch(progress, (val) => {
    if (!audio_el || !audio_el.duration) return
    const target = (val / 100) * audio_el.duration
    if (Math.abs(audio_el.currentTime - target) > 1) {
        audio_el.currentTime = target
    }
})

function toggle_play() {
    if (!audio_el) return
    if (is_playing.value) {
        audio_el.pause()
        is_playing.value = false
        if (raf_id) cancelAnimationFrame(raf_id)
    } else {
        audio_el.play()
        is_playing.value = true
        update_progress()
    }
}

/**
 * 下载当前音频文件
 */
function download_audio() {
    if (!props.audioSrc) return
    const a = document.createElement('a')
    a.href = props.audioSrc
    a.download = `sonic-slate-${Date.now()}.wav`
    a.click()
}

function cleanup_audio() {
    if (raf_id) cancelAnimationFrame(raf_id)
    if (audio_el) {
        audio_el.pause()
        audio_el = null
    }
    is_playing.value = false
    progress.value = 0
    current_time.value = '00:00'
    total_time.value = '00:00'
}

/**
 * 关闭播放面板，停止音频并通知父组件
 */
function close_player() {
    cleanup_audio()
    emit('close')
}

onBeforeUnmount(cleanup_audio)
</script>

<template>
  <div class="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 sm:px-6">
    <div class="relative glass-panel-strong rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-3 pl-4 flex items-center gap-4">
      <button
        class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-surface-700 hover:bg-surface-600
               flex items-center justify-center cursor-pointer transition-colors duration-200"
        aria-label="关闭播放器"
        @click="close_player"
      >
        <i class="pi pi-times text-10 text-surface-300" />
      </button>

      <template v-if="isGenerating">
        <div class="generating-icon shrink-0 w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <div class="wave-bars">
            <span /><span /><span /><span />
          </div>
        </div>
        <div class="flex-1 min-w-0 space-y-1.5">
          <span class="block text-13 font-semibold text-surface-300 truncate">{{ preview_snippet }}</span>
          <div class="generating-track h-1 rounded-full bg-surface-700 overflow-hidden">
            <div class="generating-fill h-full rounded-full bg-primary/60" />
          </div>
        </div>
        <span class="shrink-0 text-11 font-semibold text-surface-500 pr-1">合成中…</span>
      </template>

      <template v-else>
        <button
          class="shrink-0 w-10 h-10 rounded-xl bg-primary flex items-center justify-center cursor-pointer
                 hover:bg-primary-400 transition-colors duration-200"
          @click="toggle_play"
          :aria-label="is_playing ? '暂停' : '播放'"
        >
          <i :class="is_playing ? 'pi pi-pause' : 'pi pi-play'" class="text-white text-sm" />
        </button>

        <div class="flex-1 space-y-1.5 min-w-0">
          <div class="flex justify-between text-10 font-bold text-surface-500 tracking-tight">
            <span class="truncate">{{ preview_snippet }}</span>
            <span class="shrink-0 ml-2 tabular-nums">{{ current_time }} / {{ total_time }}</span>
          </div>
          <div class="player-slider">
            <Slider v-model="progress" class="w-full" />
          </div>
        </div>

        <div class="flex items-center shrink-0">
          <Button
            icon="pi pi-download"
            severity="secondary"
            text
            rounded
            size="small"
            v-tooltip.top="'下载'"
            @click="download_audio"
          />
        </div>
      </template>
    </div>
  </div>
</template>


<style scoped>
/**
 * 合成中 — 音频波形跳动动画
 * 4 根竖条交错跳动，模拟音频可视化
 */
.wave-bars {
    display: flex;
    align-items: center;
    gap: 3px;
    height: 18px;
}

.wave-bars span {
    width: 3px;
    border-radius: 9999px;
    background: var(--p-primary-color);
    animation: wave-bounce 1s ease-in-out infinite;
}

.wave-bars span:nth-child(1) { height: 40%; animation-delay: 0s; }
.wave-bars span:nth-child(2) { height: 70%; animation-delay: 0.15s; }
.wave-bars span:nth-child(3) { height: 50%; animation-delay: 0.3s; }
.wave-bars span:nth-child(4) { height: 30%; animation-delay: 0.45s; }

@keyframes wave-bounce {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(1.8); }
}

/**
 * 合成中 — 进度条无限滑动动画
 * 模拟不确定进度的视觉反馈
 */
.generating-fill {
    width: 40%;
    animation: slide-indeterminate 1.5s ease-in-out infinite;
}

@keyframes slide-indeterminate {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(350%); }
}
</style>
