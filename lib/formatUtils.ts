export const formatCurrency = (amount: number, currency: string = '₽') => {
    // Check if it's a known currency symbol or code
    const symbolMap: Record<string, string> = {
        'RUB': '₽',
        'BYN': 'Br',
        'KZT': '₸',
        'USD': '$',
    }

    const displaySymbol = symbolMap[currency] || currency

    // Handle symbols and their positions
    if (displaySymbol === '$') {
        return `${displaySymbol}${amount.toLocaleString('ru-RU')}`
    }

    return `${amount.toLocaleString('ru-RU')} ${displaySymbol}`
}
