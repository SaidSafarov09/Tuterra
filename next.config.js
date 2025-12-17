/** @type {import('next').NextConfig} */
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
                        value: [
                            "default-src 'self'",

                            // скрипты
                            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://yastatic.net https://yandex.st https://mc.yandex.com https://accounts.google.com",

                            // запросы (FETCH / XHR)
                            "connect-src 'self' https://passport.yandex.ru https://oauth.yandex.ru https://mc.yandex.com https://yandex.ru https://accounts.google.com https://oauth2.googleapis.com",

                            // изображения
                            "img-src 'self' data: https://mc.yandex.com https://yastatic.net https://lh3.googleusercontent.com",

                            // стили
                            "style-src 'self' 'unsafe-inline'",

                            // iframe (OAuth popup)
                            "frame-src https://oauth.yandex.ru https://accounts.google.com",
                        ].join('; '),
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;