
/**
 * Detects if a product title describes an accessory rather than the main device.
 */
export function isAccessory(title: string, query: string): boolean {
    const accessoryKeywords = [
        'case', 'cover', 'back cover', 'tempered glass', 'screen protector',
        'pouch', 'wallet case', 'wallet flip', 'wallet', 'strap', 'wristband',
        'charger cable', 'usb cable', 'protector', 'skin', 'sticker', 'lens protector',
        'mount', 'holder', 'stand', 'stylus pen'
    ];

    const lowerQuery = query.toLowerCase();
    // If user explicitly searched for an accessory, don't filter
    if (accessoryKeywords.some(kw => lowerQuery.includes(kw))) {
        return false;
    }

    const lowerTitle = title.toLowerCase();
    // If title has accessory keywords but query doesn't, it's irrelevant
    return accessoryKeywords.some(kw => lowerTitle.includes(kw));
}
