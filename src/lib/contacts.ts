/**
 * src/lib/contacts.ts
 *
 * Shared helper for the contacts data layer.
 * Used by both Research Agent and Outreach Crawler.
 */
import * as fs from 'fs';
import { resolve } from 'path';

// ── Types ──────────────────────────────────────────────────────
export type ContactStatus = 'new' | 'researched' | 'model_generated' | 'sent' | 'failed';

export interface Contact {
    id: string;
    shopName: string;
    shopDomain: string;
    shopUrl: string;
    productUrl: string;
    productName: string;
    email: string;
    status: ContactStatus;
    embedUrl?: string;
    resendId?: string;
    researchedAt?: string;
    modelGeneratedAt?: string;
    emailSentAt?: string;
    error?: string;
}

// ── Paths ──────────────────────────────────────────────────────
const DATA_DIR = resolve(process.cwd(), 'data');
const CONTACTS_FILE = resolve(DATA_DIR, 'contacts.json');

// ── CRUD ───────────────────────────────────────────────────────

export function loadContacts(): Contact[] {
    if (!fs.existsSync(CONTACTS_FILE)) return [];
    const raw = fs.readFileSync(CONTACTS_FILE, 'utf-8');
    return JSON.parse(raw) as Contact[];
}

export function saveContacts(contacts: Contact[]): void {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2), 'utf-8');
}

export function addContact(contact: Contact): boolean {
    const contacts = loadContacts();
    if (isDuplicate(contact, contacts)) return false;
    contacts.push(contact);
    saveContacts(contacts);
    return true;
}

export function updateContactStatus(
    id: string,
    status: ContactStatus,
    extra?: Partial<Contact>,
): void {
    const contacts = loadContacts();
    const idx = contacts.findIndex(c => c.id === id);
    if (idx === -1) return;
    contacts[idx].status = status;
    if (extra) Object.assign(contacts[idx], extra);
    saveContacts(contacts);
}

// ── Queries ────────────────────────────────────────────────────

export function getByStatus(status: ContactStatus): Contact[] {
    return loadContacts().filter(c => c.status === status);
}

export function getBufferSize(): number {
    return getByStatus('researched').length;
}

export function getPendingForOutreach(): Contact[] {
    return getByStatus('researched');
}

// ── Dedup ──────────────────────────────────────────────────────

export function isDuplicate(
    candidate: Pick<Contact, 'shopDomain' | 'email'>,
    existingContacts?: Contact[],
): boolean {
    const contacts = existingContacts ?? loadContacts();
    return contacts.some(
        c =>
            c.shopDomain === candidate.shopDomain ||
            (candidate.email && c.email === candidate.email),
    );
}

export function isDomainKnown(domain: string): boolean {
    return loadContacts().some(c => c.shopDomain === domain);
}

// ── Stats ──────────────────────────────────────────────────────

export function getStats(): Record<ContactStatus, number> {
    const contacts = loadContacts();
    const stats: Record<string, number> = {
        new: 0,
        researched: 0,
        model_generated: 0,
        sent: 0,
        failed: 0,
    };
    for (const c of contacts) {
        stats[c.status] = (stats[c.status] || 0) + 1;
    }
    return stats as Record<ContactStatus, number>;
}
