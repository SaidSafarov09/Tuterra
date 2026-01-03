
export function maskDate(value: string): string {

    const digits = value.replace(/\D/g, '');

    let formatted = '';
    if (digits.length > 0) {
        // Day
        formatted += digits.substring(0, 2);
        if (digits.length > 2) {
            // Month
            formatted += '.' + digits.substring(2, 4);
            if (digits.length > 4) {
                // Year
                formatted += '.' + digits.substring(4, 8);
            }
        }
    }
    return formatted;
}


export function apiFormatDate(value: string): string | null {
    const parts = value.split('.');
    if (parts.length !== 3) return null;

    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];

    if (year.length !== 4) return null;

    return `${year}-${month}-${day}`;
}
export function displayFormatDate(date: string | Date | null | undefined): string {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    return `${day}.${month}.${year}`;
}
