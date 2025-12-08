import { ImageResponse } from 'next/og'

export const size = {
    width: 32,
    height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 24,
                    background: 'transparent',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <rect x="13" y="10" width="6" height="18" rx="3" fill="#4A6CF7" />
                    <rect x="6" y="4" width="20" height="6" rx="3" fill="#4A6CF7" />
                    <circle cx="24" cy="26" r="3" fill="#4A6CF7" fillOpacity="0.4" />
                </svg>
            </div>
        ),
        {
            ...size,
        }
    )
}
