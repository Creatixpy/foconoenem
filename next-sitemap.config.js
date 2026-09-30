/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://aproviaedu.vercel.app',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
  },
  exclude: [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/redacao',
    '/questoes',
    '/conta',
    '/resultados/*', 
    '/api/*', 
    '/auth/*', 
    '/conta/*',
    '/doacao/sucesso',
    '/noticias/admin',
    '/noticias/pesquisa',
  ],
  generateIndexSitemap: false,
  outDir: 'public',
  changefreq: 'daily',
  priority: 0.7,
  additionalPaths: async () => [
    {
      loc: '/planos',
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: new Date().toISOString(),
    },
  ],
  transform: async (config, path) => {
    // Personalizar prioridade para páginas específicas
    if (path === '/') {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString(),
      };
    }
    if (path === '/noticias') {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 0.8,
        lastmod: new Date().toISOString(),
      };
    }
    if (path === '/doacao') {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.6,
        lastmod: new Date().toISOString(),
      };
    }
    if (path === '/sobre') {
      return {
        loc: path,
        changefreq: 'monthly',
        priority: 0.5,
        lastmod: new Date().toISOString(),
      };
    }
    
    // Configuração padrão para outras páginas
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};
