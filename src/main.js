import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import './style.css';

import { createApp } from 'vue';
import App from './App.vue';

/**
 * PrimeVue 主题配置
 * 将项目品牌色体系（Indigo）映射到 Aura preset 的 semantic token
 * 使 PrimeVue 组件原生继承项目主题色
 */
const Fluent = definePreset(Aura, {
    primitive: {
        indigo: {
            50: '#e2dfff',
            100: '#c3c0ff',
            200: '#a5a0ff',
            300: '#8b83ff',
            400: '#6f65f0',
            500: '#4f46e5',
            600: '#3525cd',
            700: '#3323cc',
            800: '#2a1ba6',
            900: '#211480',
        },
    },
    semantic: {
        borderRadius: '0.75rem',
        primary: {
            50: '{indigo.50}',
            100: '{indigo.100}',
            200: '{indigo.200}',
            300: '{indigo.300}',
            400: '{indigo.400}',
            500: '{indigo.500}',
            600: '{indigo.600}',
            700: '{indigo.700}',
            800: '{indigo.800}',
            900: '{indigo.900}',
        },
        overlay: {
            popover: {
                shadow: 'rgba(19, 27, 46, 0.06) 0px 12px 32px',
            },
            navigation: {
                shadow: 'rgba(19, 27, 46, 0.06) 0px 12px 32px',
            },
        },
        colorScheme: {
            dark: {
                primary: {
                    color: '#a5a0ff',
                    contrastColor: '#ffffff',
                    hoverColor: '#8b83ff',
                    activeColor: '#6f65f0',
                },
                highlight: {
                    background: 'rgba(165, 160, 255, .16)',
                    focusBackground: 'rgba(165, 160, 255, .24)',
                    color: 'rgba(255,255,255,.87)',
                    focusColor: 'rgba(255,255,255,.87)',
                },
                surface: {
                    0: '#ffffff',
                    50: '#fbfaff',
                    100: '#f5f4f8',
                    200: '#e4e3eb',
                    300: '#cac8d6',
                    400: '#a8a5b8',
                    500: '#4a4660',
                    600: '#2e2a4c',
                    700: '#262342',
                    800: '#1e1b38',
                    900: '#110f24',
                    950: '#0c0a1a',
                },
            },
        },
    },
});

const app = createApp(App);
app.use(PrimeVue, {
    unstyled: false,
    theme: {
        preset: Fluent,
        options: {
            darkModeSelector: '.app-dark',
            cssLayer: {
                name: 'primevue',
                order: 'theme, base, primevue',
            },
        },
    },
    pt:{
        button: {
            root: { class: 'rounded-xl' },
            label: { class: 'leading-6' }
        },
        selectbutton: {
            root: { class: 'voice-group' },
            pcToggleButton: {
                root: ({ context }) => ({
                    class: context.active ? 'voice-btn voice-btn-active' : 'voice-btn'
                })
            }
        },
        dialog: {
            mask: { class: 'dark-dialog-mask' }
        }
    }
});
app.use(ConfirmationService);
app.use(ToastService);
app.directive('tooltip', Tooltip);
app.mount('#app');
