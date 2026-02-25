// SpliBi - OCR Utility
// Uses Tesseract.js for local receipt OCR processing

import Tesseract from 'tesseract.js';

/**
 * Convert a File/Blob to a PNG data URL via canvas for reliable Tesseract input.
 * Tesseract.js WASM sometimes can't read raw Blob/File directly — drawing
 * through an Image + Canvas guarantees a valid PNG buffer.
 */
function processImageSource(imageSource) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        let isString = typeof imageSource === 'string';

        img.onload = () => {
            // Limit image dimensions to prevent WASM out-of-memory and speed up OCR significantly
            const MAX_DIM = 1200; // further reduced dimension
            let width = img.naturalWidth;
            let height = img.naturalHeight;

            if (width > MAX_DIM || height > MAX_DIM) {
                if (width > height) {
                    height = Math.round(height * (MAX_DIM / width));
                    width = MAX_DIM;
                } else {
                    width = Math.round(width * (MAX_DIM / height));
                    height = MAX_DIM;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Draw image scaled down
            ctx.drawImage(img, 0, 0, width, height);

            // Output as Blob buffer - most reliable way for Tesseract.js Worker to parse data
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Gagal mengkonversi gambar ke format blob'));
                }
            }, 'image/jpeg', 0.8);
        };

        img.onerror = () => {
            if (isString) {
                resolve(imageSource);
            } else {
                reject(new Error('Gagal memuat gambar untuk OCR'));
            }
        };

        if (isString) {
            img.src = imageSource;
        } else if (imageSource instanceof Blob || imageSource instanceof File) {
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Gagal membaca blob gambar'));
            reader.readAsDataURL(imageSource);
        } else {
            return reject(new Error('Format gambar tidak didukung'));
        }
    });
}

/**
 * Process a receipt image and extract line items
 * @param {File|Blob|string} image - Image file or URL
 * @param {function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} Parsed receipt data
 */
export async function processReceiptImage(image, onProgress = () => { }) {
    try {
        onProgress(5);

        // Convert to Canvas element for reliable Tesseract input
        const processedImage = await processImageSource(image);
        onProgress(10);

        const result = await Tesseract.recognize(processedImage, 'ind+eng', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    onProgress(10 + Math.round(m.progress * 80));
                }
            }
        });

        onProgress(90);

        const text = result.data.text;
        const parsed = parseReceiptText(text);

        onProgress(100);
        return parsed;
    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Gagal memproses gambar struk. Silakan coba lagi atau masukkan secara manual.');
    }
}

/**
 * Parse OCR text into structured receipt data
 */
function parseReceiptText(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    const items = [];
    let storeName = '';
    let date = '';
    let total = 0;
    let tax = 0;
    let service = 0;

    if (lines.length > 0) {
        storeName = lines[0];
    }

    // Date Pattern (e.g. 17-06-2024 or 17/06/2024)
    const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
    // Amounts like Subtotal, Tax, Service
    const totalPattern = /(?:total|jumlah|grand|bayar|subtotal)\s*[:-]*\s*([\d.,]+)/i;
    const taxPattern = /(?:pajak|ppn|tax|pb1)\s*[:-]*\s*([\d.,]+)/i;
    const servicePattern = /(?:service|servis|layanan|charge)\s*[:-]*\s*([\d.,]+)/i;

    let lastName = '';

    for (const line of lines) {
        const lowerLine = line.toLowerCase();

        // 1. Check Date
        const dateMatch = line.match(datePattern);
        if (dateMatch && !date) {
            let day = dateMatch[1];
            let month = dateMatch[2];
            let year = dateMatch[3];
            if (year.length === 2) year = '20' + year;
            date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            continue;
        }

        // 2. Constants (Total, Tax, Service)
        if (totalPattern.test(line)) {
            const match = line.match(totalPattern);
            const val = parseNumber(match[1]);
            if (val > total) total = val; // Take highest total
            lastName = ''; // reset
            continue;
        }
        if (taxPattern.test(line)) {
            tax = parseNumber(line.match(taxPattern)[1]);
            lastName = '';
            continue;
        }
        if (servicePattern.test(line)) {
            service = parseNumber(line.match(servicePattern)[1]);
            lastName = '';
            continue;
        }

        // 3. Ignore common noisy lines that aren't items
        if (lowerLine.includes('item') && lowerLine.match(/^\d+\s+item/)) {
            lastName = '';
            continue;
        }
        if (/^(tanggal|kasir|meja|info|penjualan|pembulatan|kembali|tunai|cash|qris|edc|grand\s*j|total)/.test(lowerLine)) {
            lastName = '';
            continue;
        }

        // 4. Try Items
        // Find prices formatted as XX.XXX (at least 4 digits/symbols)
        const priceMatches = [...line.matchAll(/([\d.,]{4,})/g)];

        // Count alphabetical characters
        const alphaCount = (line.match(/[a-zA-Z]/g) || []).length;

        if (priceMatches.length > 0) {
            let priceStr = priceMatches[priceMatches.length - 1][1]; // take the last price found on the line
            let price = extractPrice(priceStr);

            // Extract quantity (e.g. "2x", "2 x")
            let qty = 1;
            const qtyMatch = line.match(/(?:^|\s)(\d+)\s*[xX×]/);
            if (qtyMatch) {
                qty = parseInt(qtyMatch[1]) || 1;
            }

            // Is this a Price Only Line? (Few letters, usually just "x" or "@")
            if (alphaCount < 5) {
                let name = cleanItemName(lastName);
                if (!name || name.length < 2) {
                    name = `Item ${items.length + 1}`;
                }
                items.push({ name, qty, price });
                lastName = '';
                continue;
            }
            // Is this a Single Line Item? (Has prices, AND has enough letters to be a name)
            else {
                // Strip the trailing prices and quantities to isolate the name part
                let namePart = line.split(/[\d.,]{4,}/)[0]; // take everything before the first price
                namePart = namePart.replace(/(?:^|\s)\d+\s*[xX×].*$/, ''); // strip out the quantity and anything after

                let name = cleanItemName(namePart);
                if (name.length >= 2) {
                    items.push({ name, qty, price });
                    lastName = '';
                    continue;
                }
            }
        }

        // 5. Unrecognized lines could be item names for the next line
        // Only keep if it possesses alphabetical letters
        if (line.length > 2 && /[a-zA-Z]/.test(line)) {
            lastName = line.trim();
        } else {
            lastName = '';
        }
    }

    return {
        storeName,
        date: date || new Date().toISOString().split('T')[0],
        items,
        total,
        tax,
        service,
        rawText: text
    };
}

function parseNumber(str) {
    return parseInt(String(str).replace(/[.,]/g, ''), 10) || 0;
}

// Clean extraneous prefix/suffix symbols from parsed names
function cleanItemName(name) {
    let stringName = String(name || '');
    // Remove leading non-letters (e.g. "4 ", "| ")
    let cleaned = stringName.replace(/^[^a-zA-Z]+/, '');
    // Remove trailing symbols (e.g. " |", " -")
    cleaned = cleaned.replace(/[^a-zA-Z0-9)\s]+$/, '');
    return cleaned.trim();
}

function extractPrice(priceStr) {
    let cleaned = String(priceStr || '').trim();
    let price = parseNumber(cleaned);

    // Dedup heuristic for OCR glued prices (e.g. 1500015000 -> 15000)
    const priceString = price.toString();
    if (priceString.length >= 8) {
        let half = Math.floor(priceString.length / 2);
        if (priceString.substring(0, half) === priceString.substring(half)) {
            price = parseInt(priceString.substring(0, half), 10);
        }
    }

    // Remove "4" prefix artifact from "@" misread
    if (price > 100000 && price.toString().startsWith('4')) {
        price = parseNumber(price.toString().substring(1));
    }
    return price;
}
