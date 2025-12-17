/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' 
                https://yastatic.net 
                https://mc.yandex.com 
                https://accounts.google.com;
              connect-src 'self' 
                https://passport.yandex.ru 
                https://mc.yandex.com 
                https://yandex.ru 
                https://accounts.google.com;
              img-src 'self' 
                data: 
                https://avatars.yandex.net 
                https://yandex.st 
                https://mc.yandex.com 
                https://img.youtube.com 
                https://lh3.googleusercontent.com;
              style-src 'self' 'unsafe-inline';
              font-src 'self';
            `.replace(/\s{2,}/g, " "),
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;