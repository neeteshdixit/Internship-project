/**
 * End-to-End Cryptography Engine for Tactical Field Communication
 * Uses Web Crypto API with AES-GCM 256-bit symmetric payload encryption.
 */

// Generate a random 256-bit AES key
export async function generateAESKey() {
    return await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );
}

// Convert ArrayBuffer to Base64 string
export function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Convert Base64 string to ArrayBuffer
export function base64ToBuffer(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

function resolvePrimaryChatIdentifier(chatIdentifier) {
    if (Array.isArray(chatIdentifier)) {
        for (const candidate of chatIdentifier) {
            if (candidate !== undefined && candidate !== '') {
                return candidate;
            }
        }
        return null;
    }
    return chatIdentifier;
}

// Get or create deterministic secret session key for a chat
export async function getOrCreateChatKey(chatIdentifier) {
    const primaryChatIdentifier = resolvePrimaryChatIdentifier(chatIdentifier);
    const storageKey = `e2ee_key_${primaryChatIdentifier}`;
    let rawKeyBase64 = sessionStorage.getItem(storageKey);

    if (!rawKeyBase64) {
        const encoder = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.digest(
            "SHA-256",
            encoder.encode(`tactical_field_salt_${chatIdentifier}`)
        );
        const importedKey = await window.crypto.subtle.importKey(
            "raw",
            keyMaterial,
            "AES-GCM",
            true,
            ["encrypt", "decrypt"]
        );
        const exportedRaw = await window.crypto.subtle.exportKey("raw", importedKey);
        rawKeyBase64 = bufferToBase64(exportedRaw);
        sessionStorage.setItem(storageKey, rawKeyBase64);
        return importedKey;
    }

    const keyBuffer = base64ToBuffer(rawKeyBase64);
    return await window.crypto.subtle.importKey(
        "raw",
        keyBuffer,
        "AES-GCM",
        true,
        ["encrypt", "decrypt"]
    );
}

// Encrypt plaintext message with AES-GCM
export async function encryptPayload(plainText, chatIdentifier) {
    try {
        const cryptoKey = await getOrCreateChatKey(chatIdentifier);
        const encoder = new TextEncoder();
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const encryptedBuffer = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            cryptoKey,
            encoder.encode(plainText)
        );

        return {
            ciphertext: bufferToBase64(encryptedBuffer),
            iv: bufferToBase64(iv),
        };
    } catch (err) {
        console.error("Encryption error:", err);
        return { ciphertext: plainText, iv: null };
    }
}

// Decrypt ciphertext message with AES-GCM
export async function decryptPayload(ciphertext, ivBase64, chatIdentifier) {
    if (!ciphertext || !ivBase64) return ciphertext;
    try {
        const candidates = Array.isArray(chatIdentifier) ? chatIdentifier : [chatIdentifier];
        const encryptedBuffer = base64ToBuffer(ciphertext);
        const iv = new Uint8Array(base64ToBuffer(ivBase64));
        const decoder = new TextDecoder();

        for (const candidate of candidates) {
            if (candidate === undefined || candidate === '') continue;

            try {
                const cryptoKey = await getOrCreateChatKey(candidate);
                const decryptedBuffer = await window.crypto.subtle.decrypt(
                    {
                        name: "AES-GCM",
                        iv: iv,
                    },
                    cryptoKey,
                    encryptedBuffer
                );

                return decoder.decode(decryptedBuffer);
            } catch (candidateErr) {
                // Fallback to next key candidate
            }
        }

        return ciphertext;
    } catch (err) {
        return ciphertext;
    }
}