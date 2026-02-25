// SpliBi - Calculator Utility
// Pure calculation functions for bill splitting

/**
 * Format number as IDR currency
 */
export function formatIDR(amount) {
    if (amount == null || isNaN(amount)) return 'Rp 0';
    return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

/**
 * Parse IDR string back to number
 */
export function parseIDR(str) {
    if (typeof str === 'number') return str;
    return parseInt(String(str).replace(/[^\d]/g, ''), 10) || 0;
}

/**
 * Calculate subtotal of items
 */
export function calcSubtotal(items) {
    return items.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
}

/**
 * Calculate tax amount
 */
export function calcTax(subtotal, taxPercent) {
    return subtotal * (taxPercent / 100);
}

/**
 * Calculate service fee
 */
export function calcService(subtotal, servicePercent) {
    return subtotal * (servicePercent / 100);
}

/**
 * Calculate tip amount
 */
export function calcTip(subtotal, tipPercent) {
    return subtotal * (tipPercent / 100);
}

/**
 * Calculate grand total
 */
export function calcGrandTotal({ subtotal, tax, service, tip, discount = 0 }) {
    return subtotal + tax + service + tip - discount;
}

/**
 * Split equally among N people
 */
export function splitEqual({ grandTotal, numPeople }) {
    if (numPeople <= 0) return [];
    const perPerson = Math.ceil(grandTotal / numPeople);
    return Array(numPeople).fill(perPerson);
}

/**
 * Split by custom proportions
 * @param {number} grandTotal
 * @param {Array<{name: string, proportion: number}>} people
 */
export function splitByProportion({ grandTotal, people }) {
    const totalProportion = people.reduce((s, p) => s + p.proportion, 0);
    if (totalProportion === 0) return people.map(p => ({ ...p, amount: 0 }));

    return people.map(p => ({
        ...p,
        amount: Math.round((p.proportion / totalProportion) * grandTotal)
    }));
}

/**
 * Split by items ("Go Dutch")
 * Each person pays for their assigned items plus their share of tax/service/tip
 * @param {Object} params
 * @param {Array} params.items - [{name, price, qty, assignedTo: [personId]}]
 * @param {Array} params.people - [{id, name}]
 * @param {number} params.taxPercent
 * @param {number} params.servicePercent
 * @param {number} params.tipPercent
 * @param {number} params.discount
 */
export function splitByItems({ items, people, taxPercent = 0, servicePercent = 0, tipPercent = 0, discount = 0 }) {
    const subtotal = calcSubtotal(items);
    const extraRate = 1 + (taxPercent / 100) + (servicePercent / 100) + (tipPercent / 100);
    const discountRate = subtotal > 0 ? (1 - discount / subtotal) : 1;

    const result = {};
    people.forEach(p => {
        result[p.id] = {
            ...p,
            items: [],
            subtotal: 0,
            amount: 0
        };
    });

    items.forEach(item => {
        const assigned = item.assignedTo || [];
        if (assigned.length === 0) return;

        const itemTotal = item.price * (item.qty || 1);
        const perPerson = itemTotal / assigned.length;

        assigned.forEach(personId => {
            if (result[personId]) {
                result[personId].items.push({
                    name: item.name,
                    price: item.price,
                    qty: item.qty || 1,
                    share: perPerson
                });
                result[personId].subtotal += perPerson;
            }
        });
    });

    // Apply extras and discount proportionally
    Object.values(result).forEach(person => {
        person.amount = Math.round(person.subtotal * extraRate * discountRate);
    });

    return Object.values(result);
}

/**
 * Split tip among people based on their share percentage
 */
export function splitTip({ tipAmount, people }) {
    const totalAmount = people.reduce((s, p) => s + (p.amount || 0), 0);
    if (totalAmount === 0) {
        // Split equally if no amounts
        const each = Math.round(tipAmount / people.length);
        return people.map(p => ({ ...p, tipShare: each }));
    }

    return people.map(p => ({
        ...p,
        tipShare: Math.round((p.amount / totalAmount) * tipAmount)
    }));
}

/**
 * Apply rounding for IDR (round to nearest 100)
 */
export function roundIDR(amount) {
    return Math.ceil(amount / 100) * 100;
}
