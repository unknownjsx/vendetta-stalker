import { storage } from "@vendetta/plugin";
import { MessageCreatePayload, MessageUpdatePayload } from "./types";

export function addToWhitelist(id: string) {
    const items = storage.whitelistedIds ? storage.whitelistedIds.split(",") : [];
    items.push(id);
    storage.whitelistedIds = items.join(",");
}

export function removeFromWhitelist(id: string) {
    const items = storage.whitelistedIds ? storage.whitelistedIds.split(",") : [];
    const index = items.indexOf(id);
    if (index !== -1) items.splice(index, 1);
    storage.whitelistedIds = items.join(",");
}

export function isInWhitelist(id: string) {
    const items = storage.whitelistedIds ? storage.whitelistedIds.split(",") : [];
    return items.indexOf(id) !== -1;
}

// Convert snake_case to camelCase for all keys in an object, including nested objects
export function convertSnakeCaseToCamelCase(obj: any): any {
    if (!Array.isArray(obj) && (typeof obj !== "object" || obj === null)) return obj;

    if (Array.isArray(obj)) return obj.map(convertSnakeCaseToCamelCase);

    return Object.keys(obj).reduce((newObj, key) => {
        const camelCaseKey = key.replace(/_([a-z])/gi, (_, char) => char.toUpperCase());
        const value = convertSnakeCaseToCamelCase(obj[key]);
        return { ...newObj, [camelCaseKey]: value };
    }, {} as any);
}

// Takes a payload and returns the correct message string based on settings
export function getMessageBody(payload: MessageCreatePayload | MessageUpdatePayload): string {
    if (!storage.showMessageBody) return "Click to jump to the message";

    const { charLimit } = storage;
    const { content, attachments } = payload.message;
    const baseContent = content || attachments?.[0]?.filename || "Click to jump to the message";

    return (charLimit > 0 && baseContent.length > charLimit)
        ? `${baseContent.substring(0, charLimit)}...`
        : baseContent;
}

export const logger = {
    info: (message: string) => console.log(`[RevengeStalker] ${message}`),
    error: (message: string) => console.error(`[RevengeStalker] ${message}`),
    warn: (message: string) => console.warn(`[RevengeStalker] ${message}`)
}; 