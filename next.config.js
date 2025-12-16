const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: `
                            default-src 'self';
                            script-src 'self' yastatic.net yandex.st mc.yandex.ru 'unsafe-eval';
                            connect-src 'self' passport.yandex.ru mc.yandex.ru yandex.ru autofill.yandex.ru;
                            img-src 'self' data: mc.yandex.ru yastatic.net;
                            style-src 'self' 'unsafe-inline';
                        `.replace(/\n/g, ''),
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;