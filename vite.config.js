import { fileURLToPath, URL } from 'node:url';

import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import SvgLoader from 'vite-svg-loader';

export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    plugins: [
        vue(),
        tailwindcss(),
        components({
            resolvers: [PrimeVueResolver()],
        }),
        SvgLoader(),
    ],
});
