import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  customWorkerDir: 'worker',
  // Desactiver le precache workbox qui fait echouer l'install SW
  // On garde uniquement le custom worker (push handlers) + fetch basique
  buildExcludes: [/middleware-manifest\.json$/, /_middleware\.js$/, /\.map$/],
  publicExcludes: ['!icons/**'],
  // Aucun runtime caching : le SW ne fait QUE push notifications
  runtimeCaching: [],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);