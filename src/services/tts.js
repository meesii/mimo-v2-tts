import { reactive } from 'vue'

/**
 * TTS 模型配置，持久化到 localStorage
 * @typedef {Object} TtsConfig
 * @property {string} api_url - API 端点
 * @property {string} api_key - 鉴权密钥
 * @property {string} model - 模型标识
 * @property {string} voice - 音色标识
 */
const STORAGE_KEY = 'sonic_slate_tts_config'

const default_config = {
    api_url: 'https://api.xiaomimimo.com/v1/chat/completions',
    api_key: '',
    model: 'mimo-v2-tts',
    voice: 'mimo_default',
}

/**
 * 从 localStorage 恢复配置，合并默认值
 * @returns {TtsConfig}
 */
function load_config() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) return { ...default_config, ...JSON.parse(raw) }
    } catch { /* 忽略解析异常 */ }
    return { ...default_config }
}

/** 全局响应式配置对象 */
const tts_config = reactive(load_config())

/**
 * 保存配置到 localStorage
 */
function save_config() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        api_url: tts_config.api_url,
        api_key: tts_config.api_key,
        model: tts_config.model,
        voice: tts_config.voice,
    }))
}

/** @type {AbortController|null} 当前请求的中断控制器 */
let active_controller = null

/**
 * 调用 TTS API，返回 base64 音频数据
 * @param {string} text - 待合成文本
 * @param {string} voice - 音色标识
 * @returns {Promise<{audio_data: string, usage: Object}>}
 */
async function generate_speech(text, voice) {
    if (!tts_config.api_key) {
        throw new Error('请先在模型设置中配置 API Key')
    }

    active_controller = new AbortController()

    const response = await fetch(tts_config.api_url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': tts_config.api_key,
        },
        body: JSON.stringify({
            model: tts_config.model,
            messages: [
                { role: 'assistant', content: text },
            ],
            audio: {
                format: 'wav',
                voice: voice,
            },
        }),
        signal: active_controller.signal,
    })

    active_controller = null

    if (!response.ok) {
        const err_text = await response.text().catch(() => '')
        throw new Error(`API 请求失败 (${response.status}): ${err_text || response.statusText}`)
    }

    const data = await response.json()
    const choice = data.choices?.[0]
    const audio_data = choice?.message?.audio?.data

    if (!audio_data) {
        throw new Error('API 响应中未包含音频数据')
    }

    return { audio_data, usage: data.usage || {} }
}

/**
 * 中止当前正在进行的 TTS 请求
 */
function abort_speech() {
    if (active_controller) {
        active_controller.abort()
        active_controller = null
    }
}

export { abort_speech, generate_speech, save_config, tts_config }

