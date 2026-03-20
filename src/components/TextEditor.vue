<script setup>
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { StyleTagNode } from '../extensions/StyleTagNode.js'
import { save_config, tts_config } from '../services/tts.js'

const props = defineProps({
    isGenerating: { type: Boolean, default: false }
})
const emit = defineEmits(['generate'])

const MAX_CHARS = 5000

const voice_options = [
    { label: '默认', value: 'mimo_default', icon: 'pi pi-microphone' },
    { label: '中文', value: 'default_zh' },
    { label: '英文', value: 'default_en' }
]

/**
 * 风格标签选项集合
 * 点击后以 styleTag 节点形式插入到编辑器光标位置
 */
const style_config = {
    speed: { label: '语速', icon: 'pi pi-forward', tags: ['较快', '较慢'] },
    emotion: { label: '情感', icon: 'pi pi-heart', tags: ['开心', '悲伤', '愤怒', '紧张', '温柔'] },
    roleplay: { label: '角色扮演', icon: 'pi pi-user', tags: ['孙悟空', '林黛玉'] },
    style: { label: '风格', icon: 'pi pi-palette', tags: ['耳语', '夹子音', '台湾腔'] },
    dialect: { label: '方言', icon: 'pi pi-globe', tags: ['东北话', '四川话', '河南话', '粤语'] }
}

const style_keys = Object.keys(style_config)
const expanded_category = ref(null)

const editor = useEditor({
    extensions: [
        StarterKit.configure({
            heading: false,
            bulletList: false,
            orderedList: false,
            blockquote: false,
            codeBlock: false,
            code: false,
            horizontalRule: false,
        }),
        StyleTagNode,
    ],
    editorProps: {
        attributes: {
            class: 'tiptap-editor',
        },
    },
})

/**
 * 从编辑器内容提取纯文本（含 <style> 标签）用于 API 提交
 * 遍历 tiptap JSON，将 styleTag 节点转为 <style>label</style>
 * @returns {string}
 */
function get_submit_text() {
    if (!editor.value) return ''
    const json = editor.value.getJSON()
    return (json.content || []).map(block_to_text).join('\n')
}

/**
 * 递归将 tiptap block 节点转为提交文本
 * @param {Object} block - tiptap JSON 节点
 * @returns {string}
 */
function block_to_text(block) {
    if (!block.content) return ''
    return block.content.map(node => {
        if (node.type === 'styleTag') return `<style>${node.attrs.label}</style>`
        if (node.type === 'text') return node.text || ''
        return ''
    }).join('')
}

/**
 * 切换风格分类展开/收起
 * @param {string} key - 分类键名
 */
function toggle_category(key) {
    expanded_category.value = expanded_category.value === key ? null : key
}

const toolbar_ref = ref(null)

/**
 * 点击工具栏外部时关闭弹出层
 * @param {MouseEvent} e
 */
function handle_click_outside(e) {
    if (toolbar_ref.value && !toolbar_ref.value.contains(e.target)) {
        expanded_category.value = null
    }
}

onMounted(() => document.addEventListener('click', handle_click_outside))
onBeforeUnmount(() => document.removeEventListener('click', handle_click_outside))

/**
 * 插入风格标签节点到编辑器光标位置
 * 空标签插入后自动触发编辑态
 * @param {string} tag_text - 风格描述文本
 */
function insert_style_tag(tag_text) {
    if (!editor.value) return
    const is_empty = !tag_text
    editor.value.chain().focus().insertContent({
        type: 'styleTag',
        attrs: { label: is_empty ? '输入风格' : tag_text },
    }).run()
    expanded_category.value = null

    if (is_empty) {
        setTimeout(() => {
            const el = editor.value?.view?.dom
            if (!el) return
            const tags = el.querySelectorAll('.style-tag-node')
            const last = tags[tags.length - 1]
            if (last) last.click()
        }, 50)
    }
}

const example_scenes = [
    {
        title: '疲惫打工人',
        icon: 'pi pi-moon',
        category: '日常',
        text: '<style>极其疲惫，有气无力</style>师傅……到地方了叫我一声……<style>长叹一口气</style>我先眯一会儿，这班加得我魂儿都要散了。'
    },
    {
        title: '激动解说',
        icon: 'pi pi-megaphone',
        category: '解说',
        text: '<style>激动，语速加快</style>球进了！球进了！<style>声嘶力竭</style>绝杀！最后三秒的绝杀！'
    },
    {
        title: '温柔晚安',
        icon: 'pi pi-star',
        category: '情感',
        text: '<style>温柔，轻声细语</style>今天辛苦了，早点休息吧。<style>耳语</style>晚安，好梦。'
    },
    {
        title: '东北唠嗑',
        icon: 'pi pi-comments',
        category: '方言',
        text: '<style>东北话，热情豪爽</style>哎呀妈呀，你可算来了！<style>大笑</style>快进屋，外头冷得嗷嗷的。'
    },
    {
        title: '童话故事',
        icon: 'pi pi-book',
        category: '叙事',
        text: '<style>温柔，讲故事</style>从前有一座大山，山里住着一只小狐狸。<style>神秘</style>有一天晚上，它发现了一颗会发光的种子……'
    },
    {
        title: '新闻播报',
        icon: 'pi pi-globe',
        category: '播报',
        text: '<style>正式，新闻腔</style>各位观众晚上好，欢迎收看今日新闻。<style>严肃</style>据报道，今年全球气温再创新高。'
    },
    {
        title: '四川火锅',
        icon: 'pi pi-heart',
        category: '方言',
        text: '<style>四川话，热情</style>走走走，今天整顿火锅！<style>兴奋</style>毛肚鹅肠黄喉，巴适得板！'
    },
    {
        title: '悬疑旁白',
        icon: 'pi pi-eye',
        category: '叙事',
        text: '<style>低沉，缓慢</style>那扇门已经三十年没有打开过了。<style>紧张，压低声音</style>直到那天深夜……有人听到了里面传来的脚步声。'
    }
]

const example_popover = ref(null)

/**
 * 将示例文本解析为 tiptap 内容并填入编辑器
 * @param {string} raw - 含 <style> 标签的原始文本
 */
function apply_example(raw) {
    if (!editor.value) return
    const content = parse_raw_to_tiptap(raw)
    editor.value.commands.setContent({ type: 'doc', content })
    example_popover.value?.hide()
}

/**
 * 将含 <style>xxx</style> 的原始文本解析为 tiptap JSON content 数组
 * @param {string} raw - 原始文本
 * @returns {Array}
 */
function parse_raw_to_tiptap(raw) {
    const parts = raw.split(/(<style>.*?<\/style>)/g)
    const nodes = []
    for (const part of parts) {
        if (!part) continue
        const match = part.match(/^<style>(.*?)<\/style>$/)
        if (match) {
            nodes.push({ type: 'styleTag', attrs: { label: match[1] } })
        } else {
            nodes.push({ type: 'text', text: part })
        }
    }
    return [{ type: 'paragraph', content: nodes }]
}

const char_count = computed(() => {
    if (!editor.value) return 0
    return editor.value.storage.characterCount?.characters?.() ?? editor.value.getText().length
})
const is_over_limit = computed(() => char_count.value > MAX_CHARS)

/**
 * 校验并触发音频生成
 * 若文本含风格标签但开头不是标签，自动补 <style>正常语速</style>
 */
function handle_generate() {
    let text = get_submit_text().trim()
    if (!text || is_over_limit.value || props.isGenerating) return
    const has_tag = /<style>.*?<\/style>/.test(text)
    if (has_tag && !text.startsWith('<style>')) {
        text = '<style>正常语速</style>' + text
    }
    emit('generate', text, tts_config.voice)
}

defineExpose({ example_popover })
</script>

<template>
  <!-- 语音切换 + 风格标签工具栏 -->
  <div class="mb-5 flex flex-wrap items-stretch justify-between gap-2 relative z-50">
    <SelectButton
      v-model="tts_config.voice"
      :options="voice_options"
      option-label="label"
      option-value="value"
      :allow-empty="false"
      @update:model-value="save_config"
    />

    <div ref="toolbar_ref" class="flex items-center gap-1 glass-panel rounded-xl px-1.5 py-1 shadow-sm">
      <template v-for="(key, idx) in style_keys" :key="key">
        <span v-if="idx > 0" class="w-px h-4 bg-surface-700 shrink-0"></span>
        <div class="relative ">
          <Button
            :icon="style_config[key].icon"
            :label="style_config[key].label"
            size="small"
            text
            :severity="expanded_category === key ? 'primary' : 'secondary'"
            class="style-category-btn"
            @click="toggle_category(key)"
          />
          <Transition name="fade">
            <div
              v-if="expanded_category === key"
              class="absolute top-full left-0 mt-2 z-50 style-popover rounded-xl p-2 flex flex-wrap gap-1.5 min-w-max shadow-lg"
            >
              <Button
                v-for="tag in style_config[key].tags"
                :key="tag"
                :label="tag"
                size="small"
                outlined
                severity="secondary"
                class="style-tag-btn"
                @click="insert_style_tag(tag)"
              />
            </div>
          </Transition>
        </div>
      </template>
    </div>
  </div>

  <!-- 编辑器主体 -->
  <div class="relative">
    <div class="glass-panel rounded-4xl shadow-2xl overflow-hidden transition-colors duration-300 focus-within:border-primary/40">
      <div class="p-6 min-h-[320px] flex flex-col">
        <EditorContent :editor="editor" class="flex-1 w-full min-h-[200px] max-h-[400px] overflow-y-auto" />

        <div class="pt-4 border-t border-surface-700 flex justify-between items-center mt-4">
          <div class="flex items-center gap-2">
            <Button
              icon="pi pi-trash"
              size="small"
              text
              severity="secondary"
              rounded
              v-tooltip.top="'清空输入'"
              @click="editor?.commands.clearContent()"
            />
            <Button
              icon="pi pi-book"
              size="small"
              text
              severity="secondary"
              rounded
              v-tooltip.top="'示例文本'"
              @click="(e) => example_popover?.toggle(e)"
            />
            <Button
              icon="pi pi-tag"
              size="small"
              text
              severity="secondary"
              rounded
              v-tooltip.top="'插入风格标签'"
              @click="insert_style_tag('')"
            />
            <span class="text-11 tabular-nums" :class="is_over_limit ? 'text-red-400' : 'text-surface-500'">
              {{ char_count.toLocaleString() }}<span class="text-surface-600">/{{ MAX_CHARS.toLocaleString() }}</span>
            </span>
          </div>

          <Button
            :label="isGenerating ? '生成中…' : '生成语音'"
            :icon="isGenerating ? 'pi pi-spin pi-spinner' : 'pi pi-sparkles'"
            :disabled="!editor?.getText().trim() || is_over_limit || isGenerating"
            :loading="isGenerating"
            raised
            rounded
            @click="handle_generate"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- 示例文本弹出面板 -->
  <Popover ref="example_popover" class="style-popover w-[480px]">
    <div class="p-3 space-y-2 max-h-[360px] overflow-y-auto">
      <div class="flex items-center justify-between mb-1 px-1">
        <span class="text-13 font-semibold text-surface-300">示例文本</span>
        <span class="text-11 text-surface-500">点击填入编辑器</span>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div
          v-for="scene in example_scenes"
          :key="scene.title"
          class="rounded-xl p-3 cursor-pointer transition-colors duration-200
                 bg-surface-800/40 hover:bg-surface-700/60 border border-transparent hover:border-primary/20"
          @click="apply_example(scene.text)"
        >
          <div class="flex items-center gap-2 mb-1.5">
            <i :class="scene.icon" class="text-primary text-xs" />
            <span class="text-13 font-semibold text-surface-200">{{ scene.title }}</span>
            <span class="ml-auto text-10 text-surface-500 bg-surface-700/60 px-1.5 py-0.5 rounded-full">{{ scene.category }}</span>
          </div>
          <p class="text-11 leading-relaxed text-surface-400 line-clamp-2">{{ scene.text.replace(/<\/?style>/g, '') }}</p>
        </div>
      </div>
    </div>
  </Popover>
</template>
