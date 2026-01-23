
// Extract technical specifications from product titles/descriptions
// Simulates the structured data parsing of 91mobiles

export interface ProductSpecs {
    ram?: string;
    storage?: string;
    display?: string;
    camera?: string;
    processor?: string;
    battery?: string;
}

export function extractSpecs(title: string): ProductSpecs {
    const t = title.toLowerCase();
    const specs: ProductSpecs = {};

    // 1. RAM Extraction
    // Matches: 8GB RAM, 12GB, 8 GB
    const ramMatch = t.match(/(\d+)\s?(gb|mb)\s?(ram)?/);
    if (ramMatch && ramMatch[1]) {
        // Filter out small numbers that might be storage identifiers like "128gb" unless explicitly followed by RAM
        if (Number(ramMatch[1]) <= 32 || t.includes(ramMatch[0] + ' ram')) {
            specs.ram = `${ramMatch[1]} GB RAM`;
        }
    }

    // 2. Storage Extraction
    // Matches: 128GB, 256GB, 1TB, 1 TB
    const storageMatch = t.match(/(\d+)\s?(gb|tb)\s?(rom|storage|ssd|hdd)?/);
    // We need to distinguish RAM from Storage. Usually Storage > 32GB
    if (storageMatch) {
        const val = Number(storageMatch[1]);
        const unit = storageMatch[2];

        if (unit === 'tb') {
            specs.storage = `${val} TB Storage`;
        } else if (val >= 32 && !t.includes(storageMatch[0] + ' ram')) {
            specs.storage = `${val} GB Storage`;
        }
    }

    // 3. Display Extraction
    // Matches: 6.7 inch, 6.1", AMOLED, OLED, FHD+
    const sizeMatch = t.match(/(\d+(\.\d+)?)\s?(-| )?inch/);
    const typeMatch = t.match(/(amoled|oled|lcd|retina|super retina|dynamic amoled)/);
    const rateMatch = t.match(/(\d+)\s?hz/);

    const displayParts = [];
    if (sizeMatch) displayParts.push(`${sizeMatch[1]}"`);
    if (typeMatch) displayParts.push(typeMatch[1].replace(/\b\w/g, l => l.toUpperCase()));
    if (rateMatch) displayParts.push(`${rateMatch[1]}Hz`);

    if (displayParts.length > 0) {
        specs.display = displayParts.join(' ');
    }

    // 4. Processor (Simple Keyword Match)
    const processors = [
        'snapdragon 8 gen 3', 'snapdragon 8 gen 2', 'snapdragon',
        'dimensity 9300', 'dimensity 9000', 'dimensity',
        'a17 pro', 'a16 bionic', 'a15',
        'tensor g3', 'tensor g2',
        'helio', 'exynos'
    ];
    for (const p of processors) {
        if (t.includes(p)) {
            specs.processor = p.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            break;
        }
    }

    // 5. Connectivity (5G)
    if (t.includes('5g')) {
        if (!specs.processor) specs.processor = "5G Supported";
    }

    // 6. Battery Extraction
    // Matches: 5000mah, 5000 mAh
    const batteryMatch = t.match(/(\d{3,5})\s?mah/);
    if (batteryMatch) {
        specs.battery = `${batteryMatch[1]} mAh`;
    }

    // 7. Camera Extraction
    // Matches: 50MP, 108MP Main Camera
    const cameraMatch = t.match(/(\d{2,3})\s?mp/);
    if (cameraMatch) {
        specs.camera = `${cameraMatch[1]} MP Main Camera`;
    }

    return specs;
}
