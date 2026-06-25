// trigger restart
const nextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.lendi.edu.in' },
      { protocol: 'https', hostname: 'lendi.edu.in' },
    ],
  },
};

export default nextConfig;
