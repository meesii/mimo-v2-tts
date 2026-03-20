import { mergeAttributes, Node, nodeInputRule } from '@tiptap/core'
import { DOMParser as PmDOMParser } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'

/**
 * 粘贴文本中 <style>xxx</style> 转为编辑器可识别的 span 标签
 * @param {string} text - 原始粘贴文本
 * @returns {string}
 */
function convert_style_tags_to_spans(text) {
    return text.replace(/<style>(.*?)<\/style>/g,
        (_, label) => `<span data-style-tag class="style-tag-node" contenteditable="false">${label}</span>`
    )
}

/**
 * Tiptap 自定义内联节点 — 风格标签
 * 在编辑器中渲染为不可编辑的标签气泡，导出时转为 <style>xxx</style>
 */
const StyleTagNode = Node.create({
    name: 'styleTag',
    group: 'inline',
    inline: true,
    atom: true,

    addAttributes() {
        return {
            label: {
                default: '',
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-style-tag]',
                getAttrs(dom) {
                    return { label: dom.textContent || '' }
                },
            },
        ]
    },

    renderHTML({ node, HTMLAttributes }) {
        return [
            'span',
            mergeAttributes(HTMLAttributes, {
                'data-style-tag': '',
                class: 'style-tag-node',
                contenteditable: 'false',
            }),
            node.attrs.label,
        ]
    },

    addInputRules() {
        return [
            nodeInputRule({
                find: /(<style>(.*?)<\/style>)$/,
                type: this.type,
                getAttributes(match) {
                    return { label: match[2] || '' }
                },
            }),
        ]
    },

    addNodeView() {
        return ({ node, getPos, editor: node_editor }) => {
            const dom = document.createElement('span')
            dom.setAttribute('data-style-tag', '')
            dom.className = 'style-tag-node'
            dom.contentEditable = 'false'
            dom.textContent = node.attrs.label

            /**
             * 点击气泡弹出浮层 input 编辑，失焦/回车保存
             * 使用绝对定位的 input 覆盖在气泡上方，模拟原地编辑体验
             */
            dom.addEventListener('click', (e) => {
                e.stopPropagation()
                e.preventDefault()
                if (dom.querySelector('.style-tag-input')) return

                const input = document.createElement('input')
                input.type = 'text'
                input.value = node.attrs.label
                input.className = 'style-tag-input'
                dom.textContent = ''

                /**
                 * 隐藏 span 用于测量文字宽度，驱动 input 自适应
                 * @private
                 */
                const sizer = document.createElement('span')
                sizer.className = 'style-tag-sizer'
                sizer.textContent = input.value || ' '
                dom.appendChild(sizer)
                dom.appendChild(input)

                /**
                 * 根据 sizer 宽度同步 input 宽度
                 * @private
                 */
                function sync_width() {
                    sizer.textContent = input.value || ' '
                    input.style.width = sizer.offsetWidth + 'px'
                }
                input.addEventListener('input', sync_width)
                sync_width()
                input.focus()

                /**
                 * 提交编辑结果，更新或删除节点
                 * @private
                 */
                function commit() {
                    const new_label = input.value.trim()
                    const pos = getPos()
                    if (typeof pos !== 'number') return

                    if (!new_label) {
                        node_editor.view.dispatch(
                            node_editor.view.state.tr.delete(pos, pos + node.nodeSize)
                        )
                        return
                    }
                    if (new_label !== node.attrs.label) {
                        node_editor.view.dispatch(
                            node_editor.view.state.tr.setNodeMarkup(pos, undefined, { label: new_label })
                        )
                    } else {
                        dom.textContent = node.attrs.label
                    }
                    node_editor.commands.focus()
                }

                input.addEventListener('blur', commit, { once: true })
                input.addEventListener('keydown', (ke) => {
                    if (ke.key === 'Enter') {
                        ke.preventDefault()
                        input.blur()
                    }
                    if (ke.key === 'Escape') {
                        ke.preventDefault()
                        dom.textContent = node.attrs.label
                        node_editor.commands.focus()
                    }
                })
            })

            return {
                dom,
                ignoreMutation: () => true,
            }
        }
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('styleTagPaste'),
                props: {
                    /**
                     * 拦截粘贴事件，将纯文本/HTML 中的 <style>xxx</style> 转为 styleTag 节点
                     * @param {EditorView} view
                     * @param {ClipboardEvent} event
                     * @returns {boolean}
                     */
                    handlePaste(view, event) {
                        const clipboard = event.clipboardData
                        if (!clipboard) return false

                        const plain = clipboard.getData('text/plain') || ''
                        const html = clipboard.getData('text/html') || ''
                        const source = html || plain

                        if (!/<style>.*?<\/style>/i.test(source)) return false

                        event.preventDefault()
                        const converted = convert_style_tags_to_spans(source)
                        const wrapper = document.createElement('div')
                        wrapper.innerHTML = converted

                        const parser = PmDOMParser.fromSchema(view.state.schema)
                        const slice = parser.parseSlice(wrapper)
                        const tr = view.state.tr.replaceSelection(slice)
                        view.dispatch(tr)
                        return true
                    },
                },
            }),
        ]
    },
})

export { StyleTagNode }

