import { patcher } from "@vendetta";
import { findByProps, findByStoreName } from "@vendetta/metro";
import { storage } from "@vendetta/plugin";
import { findInReactTree } from "@vendetta/utils";
import { React } from "@vendetta/metro/common";
import { 
    MessageCreatePayload, 
    MessageUpdatePayload, 
    MessageDeletePayload, 
    TypingStartPayload, 
    UserUpdatePayload, 
    ThreadCreatePayload 
} from "./types";
import { 
    addToWhitelist, 
    isInWhitelist, 
    logger, 
    removeFromWhitelist, 
    convertSnakeCaseToCamelCase,
    getMessageBody 
} from "./utils";
import Settings from "./settings";

// Initialize default storage values
storage.whitelistedIds ??= "";
storage.trackUserProfileChanges ??= true;
storage.trackStartedTyping ??= true;
storage.trackSentMessage ??= true;
storage.showMessageBody ??= false;
storage.charLimit ??= 100;
storage.notificationType ??= "toast"; // "toast", "alert", "console", "all"

let oldUsers: {
    [id: string]: UserUpdatePayload;
} = {};
let loggedMessages: Record<string, any> = {};

// Helper function to switch to a message/channel
const switchToMsg = (gid: string, cid?: string, mid?: string) => {
    try {
        // For mobile clients, we need to use the navigation system
        const NavigationRouter = findByProps("pushLazy", "pop", "push");
        if (NavigationRouter) {
            if (gid && cid) {
                // Navigate to the specific channel
                NavigationRouter.pushLazy({
                    screen: "Channel",
                    params: {
                        guildId: gid,
                        channelId: cid,
                        messageId: mid
                    }
                });
            } else if (cid) {
                // Navigate to DM channel
                NavigationRouter.pushLazy({
                    screen: "Channel",
                    params: {
                        channelId: cid,
                        messageId: mid
                    }
                });
            }
        }
    } catch (error) {
        logger.error(`Failed to navigate: ${error}`);
    }
};

// Mobile-optimized notification system
const showNotification = (title: string, body: string, onClick?: () => void, icon?: string) => {
    const notificationType = storage.notificationType || "toast";
    
    // Always log to console for debugging
    logger.info(`${title}: ${body}`);
    
    // Show based on user preference
    if (notificationType === "console" || notificationType === "all") {
        console.log(`[RevengeStalker] ${title}: ${body}`);
    }
    
    if (notificationType === "alert" || notificationType === "all") {
        // Use mobile alert system
        try {
            const Alert = findByProps("alert");
            if (Alert) {
                Alert.alert(title, body, [
                    { text: "Cancel", style: "cancel" },
                    { text: "View", onPress: onClick }
                ]);
            } else {
                // Fallback to simple alert
                alert(`${title}\n\n${body}`);
            }
        } catch (error) {
            alert(`${title}\n\n${body}`);
        }
    }
    
    if (notificationType === "toast" || notificationType === "all") {
        // Use mobile toast system
        try {
            const ToastAndroid = findByProps("show", "SHORT", "LONG");
            if (ToastAndroid) {
                ToastAndroid.show(`${title}: ${body}`, ToastAndroid.SHORT);
            } else {
                // Fallback to console
                console.log(`[TOAST] ${title}: ${body}`);
            }
        } catch (error) {
            console.log(`[TOAST] ${title}: ${body}`);
        }
    }
};

// Mobile-optimized toast system
const showToast = (message: string, type: "SUCCESS" | "FAILURE" = "SUCCESS") => {
    const notificationType = storage.notificationType || "toast";
    
    if (notificationType === "toast" || notificationType === "all") {
        try {
            const ToastAndroid = findByProps("show", "SHORT", "LONG");
            if (ToastAndroid) {
                ToastAndroid.show(message, ToastAndroid.SHORT);
            } else {
                console.log(`[TOAST] ${type}: ${message}`);
            }
        } catch (error) {
            console.log(`[TOAST] ${type}: ${message}`);
        }
    }
    
    if (notificationType === "alert" || notificationType === "all") {
        try {
            const Alert = findByProps("alert");
            if (Alert) {
                Alert.alert("RevengeStalker", message);
            } else {
                alert(message);
            }
        } catch (error) {
            alert(message);
        }
    }
    
    // Always log to console
    logger.info(`${type}: ${message}`);
};

// Helper function to open user profile
const openUserProfile = (userId: string) => {
    try {
        const NavigationRouter = findByProps("pushLazy", "pop", "push");
        if (NavigationRouter) {
            NavigationRouter.pushLazy({
                screen: "UserProfile",
                params: { userId }
            });
        }
    } catch (error) {
        logger.error(`Failed to open user profile: ${error}`);
    }
};

// Helper function to get current channel
const getCurrentChannel = () => {
    try {
        const ChannelStore = findByStoreName("ChannelStore");
        return ChannelStore ? ChannelStore.getChannel() : null;
    } catch (error) {
        return null;
    }
};

// Helper function to get user
const getUser = (userId: string) => {
    try {
        const UserStore = findByStoreName("UserStore");
        return UserStore ? UserStore.getUser(userId) : null;
    } catch (error) {
        return null;
    }
};

// Helper function to get message
const getMessage = (channelId: string, messageId: string) => {
    try {
        const MessageStore = findByStoreName("MessageStore");
        return MessageStore ? MessageStore.getMessage(channelId, messageId) : null;
    } catch (error) {
        return null;
    }
};

// Helper function to get channel
const getChannel = (channelId: string) => {
    try {
        const ChannelStore = findByStoreName("ChannelStore");
        return ChannelStore ? ChannelStore.getChannel(channelId) : null;
    } catch (error) {
        return null;
    }
};

// Helper function to make API requests
const makeAPIRequest = async (url: string, options: any = {}) => {
    try {
        const RestAPI = findByProps("get", "post", "put", "delete");
        if (!RestAPI) {
            logger.error("RestAPI not found");
            return null;
        }
        
        const response = await RestAPI.get({
            url,
            ...options
        });
        return response;
    } catch (error) {
        logger.error(`API request failed: ${error}`);
        return null;
    }
};

// Flux dispatcher event handlers
const fluxHandlers = {
    MESSAGE_CREATE: (payload: MessageCreatePayload) => {
        if (!payload.message || !payload.message.author || !payload.message.channel_id || !storage.trackSentMessage) return;

        const authorId = payload.message.author?.id;
        if (!isInWhitelist(authorId) || getCurrentChannel()?.id === payload.channelId) return;
        const author = getUser(authorId);
        if (!author) return;

        if (payload.message.type === 7) {
            showNotification(
                `${author.globalName || author.username} Joined a server`,
                "Tap to jump to the message.",
                () => switchToMsg(payload.guildId, payload.channelId, payload.message.id),
                author.getAvatarURL?.(undefined, undefined, false)
            );
            return;
        }

        showNotification(
            `${author.globalName || author.username} Sent a message`,
            getMessageBody(payload),
            () => switchToMsg(payload.guildId, payload.channelId, payload.message.id),
            author.getAvatarURL?.(undefined, undefined, false)
        );
    },

    MESSAGE_UPDATE: (payload: MessageUpdatePayload) => {
        if (!payload.message || !payload.message.author || !payload.message.channel_id) return;

        const authorId = payload.message.author?.id;
        if (!isInWhitelist(authorId) || getCurrentChannel()?.id === payload.message.channel_id) return;
        const author = getUser(authorId);
        if (!author) return;

        showNotification(
            `${author.globalName || author.username} Edited a message`,
            getMessageBody(payload),
            () => switchToMsg(payload.guildId, payload.message.channel_id, payload.message.id),
            author.getAvatarURL?.(undefined, undefined, false)
        );
    },

    MESSAGE_DELETE: async (payload: MessageDeletePayload) => {
        if (!payload || !payload?.channelId || !payload?.id || !payload?.guildId) return;
        
        let message = getMessage(payload.channelId, payload.id) ?? loggedMessages[payload.id];
        if (!message) {
            logger.error("Received a MESSAGE_DELETE event but the message was not found in the MessageStore");
            return;
        }

        const { author } = message;
        if (!isInWhitelist(author?.id) || getCurrentChannel()?.id === message.channel_id) return;

        showNotification(
            `${author.globalName || author.username} Deleted a message!`,
            `"${message.content.length > 100 ? message.content.substring(0, 100).concat("...") : message.content}"`,
            () => {
                switchToMsg(payload.guildId, message.channel_id, message.id);
            },
            author.getAvatarURL?.(undefined, undefined, false)
        );
    },

    TYPING_START: (payload: TypingStartPayload) => {
        if (!payload || !payload.channelId || !payload.userId || !storage.trackStartedTyping) return;

        const author = getUser(payload.userId);
        if (!isInWhitelist(author?.id) || getCurrentChannel()?.id === payload.channelId) return;

        showNotification(
            `${author.globalName || author.username} Started typing...`,
            "Tap to jump to the channel.",
            () => {
                const channel = getChannel(payload.channelId);
                if (channel) switchToMsg(channel.guild_id, payload.channelId);
            },
            author.getAvatarURL?.(undefined, undefined, false)
        );
    },

    USER_PROFILE_FETCH_SUCCESS: async (payload: UserUpdatePayload) => {
        if (!payload || !payload.user || !payload.user.id || !isInWhitelist(payload.user.id) || !storage.trackUserProfileChanges) return;

        // Normalize incoming data
        payload = convertSnakeCaseToCamelCase(payload);

        // Cache user information if we have not seen them before
        const oldUser = oldUsers[payload.user.id] ? convertSnakeCaseToCamelCase(oldUsers[payload.user.id]) : null;

        if (!oldUser) {
            oldUsers[payload.user.id] = payload;
            return;
        }

        // Determine which properties have changed
        const changedKeys = (() => {
            const keysToCompare = ["username", "globalName", "avatar", "discriminator", "clan", "flags", "banner", "banner_color", "accent_color", "bio"];
            let changedKeys: string[] = [];

            keysToCompare.forEach(key => {
                const newValue = payload.user[key];
                const oldValue = oldUser.user[key];
                if (newValue !== oldValue) changedKeys.push(key);
            });

            return changedKeys;
        })();

        // If no properties have changed, nothing further to do
        if (changedKeys.length === 0) return;

        // Send a notification showing what has changed
        const notificationTitle = payload.user.globalName || payload.user.username;
        const changedPropertiesList = changedKeys.join(', ');
        const avatarURL = getUser(payload.user.id)?.getAvatarURL?.(undefined, undefined, false);

        showNotification(
            `${notificationTitle} updated their profile!`,
            `Updated properties: ${changedPropertiesList}.`,
            () => openUserProfile(payload.user.id),
            avatarURL
        );

        // Update cached user for next time
        oldUsers[payload.user.id] = payload;
    },

    THREAD_CREATE: (payload: ThreadCreatePayload) => {
        if (!payload || !payload.channel || !payload.channel.id || !payload.channel.ownerId || !isInWhitelist(payload.channel.ownerId)) return;

        if (payload.isNewlyCreated) {
            const owner = getUser(payload.channel.ownerId);
            if (!owner) return;

            showNotification(
                `New thread created by ${owner.globalName || owner.username}`,
                `Tap to view the thread.`,
                () => switchToMsg(payload.channel.guild_id, payload.channel.parent_id),
                owner.getAvatarURL?.(undefined, undefined, false)
            );
        }
    },
};

// Context menu patch
const contextMenuPatch = (children: any[], props: any) => {
    if (!props || props?.user?.id === getUser("current")?.id) return;

    if (!children.some(child => child?.props?.id === "revenge-stalker")) {
        children.push(
            React.createElement("div", { key: "separator" }),
            React.createElement("div", {
                id: "revenge-stalker",
                label: isInWhitelist(props.user.id) ? "Stop Stalking User" : "Stalk User",
                action: () => isInWhitelist(props.user.id) ? unStalkUser(props.user.id) : stalkUser(props.user.id)
            })
        );
    }
};

// Plugin methods
const stalkUser = async (id: string) => {
    const user = getUser(id);
    if (!user) return;

    showToast(`Stalking ${user.globalName || user.username}`);
    addToWhitelist(id);
    
    const response = await makeAPIRequest(`/users/${id}/profile`, {
        query: {
            with_mutual_guilds: true,
            with_mutual_friends_count: true,
        }
    });
    
    if (response?.body) {
        oldUsers[id] = convertSnakeCaseToCamelCase(response.body);
        logger.info(`Cached user ${id} with name ${oldUsers[id].user.globalName || oldUsers[id].user.username} for further usage.`);
    }
};

const unStalkUser = (id: string) => {
    const user = getUser(id);
    if (!user) return;

    showToast(`Stopped stalking ${user.globalName || user.username}`);
    removeFromWhitelist(id);
    delete oldUsers[id];
};

// Plugin definition
export default {
    onLoad: () => {
        logger.info("RevengeStalker plugin loaded");
        
        // Initialize cached users
        const initializeCachedUsers = async () => {
            for (const id of storage.whitelistedIds.split(",")) {
                if (!id.trim()) continue;
                
                const response = await makeAPIRequest(`/users/${id}/profile`, {
                    query: {
                        with_mutual_guilds: true,
                        with_mutual_friends_count: true,
                    }
                });
                
                if (response?.body) {
                    oldUsers[id] = response.body;
                    logger.info(`Cached user ${id} with name ${oldUsers[id].user.globalName || oldUsers[id].user.username} for further usage.`);
                }
            }
        };
        
        initializeCachedUsers();
        
        // Add flux dispatcher listeners
        const FluxDispatcher = findByProps("dispatch", "subscribe");
        if (FluxDispatcher) {
            Object.entries(fluxHandlers).forEach(([event, handler]) => {
                FluxDispatcher.subscribe(event, handler);
            });
        }
        
        // Add context menu patch
        // Note: Revenge doesn't have the same context menu system as Vencord
        // This would need to be implemented differently based on Revenge's API
    },
    
    onUnload: () => {
        logger.info("RevengeStalker plugin unloaded");
        
        // Remove flux dispatcher listeners
        const FluxDispatcher = findByProps("dispatch", "subscribe");
        if (FluxDispatcher) {
            Object.entries(fluxHandlers).forEach(([event, handler]) => {
                FluxDispatcher.unsubscribe(event, handler);
            });
        }
    },
    
    settings: Settings,
    
    // Expose methods for external use
    stalkUser,
    unStalkUser,
    isInWhitelist,
    addToWhitelist,
    removeFromWhitelist
}; 