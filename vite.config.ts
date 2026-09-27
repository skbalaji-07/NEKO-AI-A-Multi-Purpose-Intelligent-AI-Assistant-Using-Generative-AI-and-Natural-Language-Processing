import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [react(), tailwindcss()];
  try {
    // @ts-ignore
    const m = await import('./.vite-source-tags.js');
    plugins.push(m.sourceTags());
  } catch {}

  const env = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_']);
  const processEnvDefines: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    processEnvDefines[`process.env.${key}`] = JSON.stringify(value);
  }

  return {
    plugins,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: processEnvDefines,
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('lucide')) return 'vendor-icons'
              if (id.includes('react-router')) return 'vendor-router'
              if (id.includes('react-dom')) return 'vendor-react-dom'
              if (id.includes('framer-motion') || id.includes('motion')) return 'vendor-motion'
              return 'vendor'
            }
            if (id.includes('/src/pages/')) {
              const name = id.split('/src/pages/')[1].split('.')[0].toLowerCase()
              return ['chat', 'landing', 'docs', 'dashboard'].includes(name) ? `page-${name}` : 'pages'
            }
            if (id.includes('/src/lib/')) return 'applib'
          },
        },
      },
    },
  };
})
