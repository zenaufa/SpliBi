// SpliBi - Database Module
// IndexedDB wrapper using idb for local storage

import { openDB } from 'idb';

const DB_NAME = 'splibi-db';
const DB_VERSION = 1;

let dbPromise = null;

export function getDB() {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Receipts store
                if (!db.objectStoreNames.contains('receipts')) {
                    const receiptStore = db.createObjectStore('receipts', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    receiptStore.createIndex('date', 'date');
                    receiptStore.createIndex('createdAt', 'createdAt');
                }

                // Groups store
                if (!db.objectStoreNames.contains('groups')) {
                    db.createObjectStore('groups', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                }

                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', {
                        keyPath: 'key'
                    });
                }
            }
        });
    }
    return dbPromise;
}

// ========== Receipts ==========

export async function saveReceipt(receipt) {
    const db = await getDB();
    receipt.createdAt = receipt.createdAt || new Date().toISOString();
    receipt.updatedAt = new Date().toISOString();
    const id = await db.put('receipts', receipt);
    return id;
}

export async function getReceipt(id) {
    const db = await getDB();
    return db.get('receipts', id);
}

export async function getAllReceipts() {
    const db = await getDB();
    const receipts = await db.getAll('receipts');
    return receipts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function deleteReceipt(id) {
    const db = await getDB();
    return db.delete('receipts', id);
}

// ========== Groups ==========

export async function saveGroup(group) {
    const db = await getDB();
    group.createdAt = group.createdAt || new Date().toISOString();
    group.updatedAt = new Date().toISOString();
    const id = await db.put('groups', group);
    return id;
}

export async function getGroup(id) {
    const db = await getDB();
    return db.get('groups', id);
}

export async function getAllGroups() {
    const db = await getDB();
    return db.getAll('groups');
}

export async function deleteGroup(id) {
    const db = await getDB();
    return db.delete('groups', id);
}

// ========== Settings ==========

export async function getSetting(key, defaultValue = null) {
    const db = await getDB();
    const record = await db.get('settings', key);
    return record ? record.value : defaultValue;
}

export async function setSetting(key, value) {
    const db = await getDB();
    return db.put('settings', { key, value });
}

// ========== Utility ==========

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
