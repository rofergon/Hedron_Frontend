import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none'
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: [
      '@hashgraph/hedera-wallet-connect',
      '@walletconnect/sign-client',
      '@reown/appkit'
    ]
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Workaround for @reown/appkit adapter issues
      '@reown/appkit/adapters': '@reown/appkit/dist/adapters/index.js'
    }
  }
});
