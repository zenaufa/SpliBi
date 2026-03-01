// SpliBi - OCR Utility
// Uses Gemini API (primary) or Tesseract.js (fallback) for receipt OCR

import Tesseract from 'tesseract.js';
import { getSetting } from '../db.js';

/**
 * Process a receipt image and extract line items.
 * Uses Gemini API if an API key is configured, otherwise falls back to Tesseract.js.
 * @param {File|Blob|string} image - Image file or URL
 * @param {function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} Parsed receipt data
 */
export async function processReceiptImage(image, onProgress = () => { }) {
    const apiKey = await getSetting('geminiApiKey', '');

    if (apiKey) {
        return processWithGemini(image, apiKey, onProgress);
    } else {
        return processWithTesseract(image, onProgress);
    }
}

// ============================================================
// GEMINI API - Primary OCR engine
// ============================================================

async function processWithGemini(image, apiKey, onProgress) {
    try {
        onProgress(10);

        // Convert image to base64
        const base64Data = await imageToBase64(image);
        onProgress(20);

        // Detect MIME type
        const mimeType = detectMimeType(base64Data) || 'image/jpeg';

        // Strip the data URL prefix if present
        const rawBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

        onProgress(30);

        // Call Gemini API
        const prompt = `Kamu adalah AI yang mengekstrak data dari foto struk/receipt Indonesia.

Analisis gambar struk ini dan ekstrak semua informasi berikut dalam format JSON:

{
  "storeName": "nama toko/restoran",
  "date": "YYYY-MM-DD",
  "items": [
    { "name": "nama item", "qty": 1, "price": 15000 }
  ],
  "tax": 0,
  "service": 0,
  "total": 0
}

Aturan penting:
- "price" adalah harga SATUAN dalam angka bulat (tanpa titik/koma). Contoh: 15.000 → 15000
- "qty" adalah jumlah item (biasanya tertulis "1x", "2x", dll)
- Jangan sertakan item duplikat
- Abaikan baris yang bukan item (seperti subtotal, total, pajak, service, dll)
- "tax" dan "service" dalam angka bulat
- "total" adalah grand total / total akhir
- Jika ada format "@15.000" itu artinya harga satuan 15000
- Hanya output JSON, tanpa teks lain`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: mimeType,
                                    data: rawBase64
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 8192
                    }
                })
            }
        );

        onProgress(80);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData?.error?.message || response.statusText;
            console.error('Gemini API error:', errorMsg);
            throw new Error(`Gemini API error: ${errorMsg}`);
        }

        const data = await response.json();
        onProgress(90);

        // Extract JSON from response
        const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('=== GEMINI RAW RESPONSE ===');
        console.log(textContent);
        console.log('===========================');

        const parsed = parseGeminiResponse(textContent);

        console.log('=== PARSED RESULT ===');
        console.log(JSON.stringify(parsed, null, 2));
        console.log('=====================');

        onProgress(100);
        return parsed;

    } catch (error) {
        console.error('Gemini OCR Error:', error);
        throw new Error('Gagal memproses struk dengan Gemini AI. ' + error.message);
    }
}

/**
 * Parse the JSON response from Gemini API
 */
function parseGeminiResponse(text) {
    // Extract JSON from response (it may be wrapped in ```json...``` or have extra text)
    let jsonStr = text;

    // Try to extract JSON block from markdown code fence
    const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
        jsonStr = jsonMatch[1];
    } else {
        // Try to find raw JSON object
        const braceMatch = text.match(/\{[\s\S]*\}/);
        if (braceMatch) {
            jsonStr = braceMatch[0];
        }
    }

    try {
        const data = JSON.parse(jsonStr);

        return {
            storeName: data.storeName || '',
            date: data.date || new Date().toISOString().split('T')[0],
            items: (data.items || []).map(item => ({
                name: item.name || 'Item',
                qty: parseInt(item.qty) || 1,
                price: parseInt(item.price) || 0
            })).filter(item => item.price > 0),
            total: parseInt(data.total) || 0,
            tax: parseInt(data.tax) || 0,
            service: parseInt(data.service) || 0,
            rawText: text
        };
    } catch (e) {
        console.error('Failed to parse Gemini JSON response:', e);
        console.error('Raw text:', jsonStr);
        throw new Error('Gagal memparse respon dari Gemini AI');
    }
}

/**
 * Convert various image sources to base64 data URL
 */
function imageToBase64(image) {
    return new Promise((resolve, reject) => {
        // Already a data URL string
        if (typeof image === 'string' && image.startsWith('data:')) {
            resolve(image);
            return;
        }

        // URL string — load as image first
        if (typeof image === 'string') {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                canvas.getContext('2d').drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
            img.onerror = () => reject(new Error('Gagal memuat gambar'));
            img.src = image;
            return;
        }

        // File or Blob
        if (image instanceof Blob || image instanceof File) {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
            reader.readAsDataURL(image);
            return;
        }

        reject(new Error('Format gambar tidak didukung'));
    });
}

/**
 * Detect MIME type from base64 data URL
 */
function detectMimeType(dataUrl) {
    const match = dataUrl.match(/^data:(image\/\w+);/);
    return match ? match[1] : null;
}

// ============================================================
// TESSERACT.JS - Fallback OCR engine (offline)
// ============================================================

/**
 * Convert a File/Blob to canvas blob for Tesseract input
 */
function processImageSource(imageSource) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        let isString = typeof imageSource === 'string';

        img.onload = () => {
            const MAX_DIM = 1200;
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
            ctx.drawImage(img, 0, 0, width, height);

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
            reader.onload = (e) => { img.src = e.target.result; };
            reader.onerror = () => reject(new Error('Gagal membaca blob gambar'));
            reader.readAsDataURL(imageSource);
        } else {
            return reject(new Error('Format gambar tidak didukung'));
        }
    });
}

async function processWithTesseract(image, onProgress) {
    try {
        onProgress(5);
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
        console.log('=== TESSERACT RAW TEXT ===');
        console.log(text);
        console.log('=========================');

        const parsed = parseReceiptText(text);

        console.log('=== PARSED RESULT ===');
        console.log(JSON.stringify(parsed, null, 2));
        console.log('=====================');

        onProgress(100);
        return parsed;
    } catch (error) {
        console.error('Tesseract OCR Error:', error);
        throw new Error('Gagal memproses gambar struk. Silakan coba lagi atau masukkan secara manual.');
    }
}

/**
 * Parse OCR text into structured receipt data (Tesseract fallback)
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

    const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
    const totalPattern = /(?:total|jumlah|grand|bayar|subtotal)\s*[:-]*\s*([\d.,]+)/i;
    const taxPattern = /(?:pajak|ppn|tax|pb1)\s*[:-]*\s*([\d.,]+)/i;
    const servicePattern = /(?:service|servis|layanan|charge)\s*[:-]*\s*([\d.,]+)/i;

    let lastName = '';

    for (const line of lines) {
        const lowerLine = line.toLowerCase();

        const dateMatch = line.match(datePattern);
        if (dateMatch && !date) {
            let day = dateMatch[1];
            let month = dateMatch[2];
            let year = dateMatch[3];
            if (year.length === 2) year = '20' + year;
            date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            continue;
        }

        if (totalPattern.test(line)) {
            const match = line.match(totalPattern);
            const val = parseNumber(match[1]);
            if (val > total) total = val;
            lastName = '';
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

        if (lowerLine.includes('item') && lowerLine.match(/^\d+\s+item/)) {
            lastName = '';
            continue;
        }
        if (/^(tanggal|kasir|meja|info|penjualan|pembulatan|kembali|tunai|cash|qris|edc|grand\s*j|total|no\s*meja|mode\s|nomor|antrian|tunggu|thank|terima)/i.test(lowerLine)) {
            lastName = '';
            continue;
        }

        // Clean @ misreads before price matching
        let workLine = line;
        workLine = workLine.replace(/[4aAq@](\d{1,3}[.,]\d{3}(?:[.,]\d{3})*)/g, (match, priceGroup, offset) => {
            const before = workLine.substring(Math.max(0, offset - 3), offset);
            if (/[xX×]\s*$/.test(before) || offset === 0 || /\s$/.test(before)) {
                return priceGroup;
            }
            return match;
        });

        const priceMatches = [...workLine.matchAll(/([\d.,]{4,})/g)];
        const alphaCount = (line.match(/[a-zA-Z]/g) || []).length;

        if (priceMatches.length > 0) {
            let priceStr = priceMatches[priceMatches.length - 1][1];
            let price = extractPrice(priceStr);

            if (priceMatches.length >= 2 && price > 500000) {
                const altPrice = extractPrice(priceMatches[priceMatches.length - 2][1]);
                if (altPrice > 0 && altPrice < 500000) {
                    price = altPrice;
                }
            }

            let qty = 1;
            const qtyMatch = line.match(/(?:^|\s)(\d+)\s*[xX×]/);
            if (qtyMatch) {
                qty = parseInt(qtyMatch[1]) || 1;
            }

            if (alphaCount < 5) {
                let name = cleanItemName(lastName);
                if (!name || name.length < 2) {
                    name = `Item ${items.length + 1}`;
                }
                items.push({ name, qty, price });
                lastName = '';
                continue;
            } else {
                let namePart = line.split(/[\d.,]{4,}/)[0];
                namePart = namePart.replace(/(?:^|\s)\d+\s*[xX×].*$/, '');
                let name = cleanItemName(namePart);
                if (name.length >= 2) {
                    items.push({ name, qty, price });
                    lastName = '';
                    continue;
                }
            }
        }

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

function cleanItemName(name) {
    let stringName = String(name || '');
    let cleaned = stringName.replace(/^[^a-zA-Z]+/, '');
    cleaned = cleaned.replace(/[^a-zA-Z0-9)\s]+$/, '');
    return cleaned.trim();
}

function extractPrice(priceStr) {
    let cleaned = String(priceStr || '').trim();
    let price = parseNumber(cleaned);

    const priceString = price.toString();
    if (priceString.length >= 8) {
        let half = Math.floor(priceString.length / 2);
        if (priceString.substring(0, half) === priceString.substring(half)) {
            price = parseInt(priceString.substring(0, half), 10);
        }
    }

    if (price > 100000 && price.toString().startsWith('4')) {
        const remainder = parseInt(price.toString().substring(1), 10);
        if (remainder >= 1000 && remainder <= 99999) {
            price = remainder;
        }
    }

    return price;
}
