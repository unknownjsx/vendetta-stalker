import { React, ReactNative } from "@vendetta/metro/common";
import { storage } from "@vendetta/plugin";
import { useProxy } from "@vendetta/storage";
import { Forms } from "@vendetta/ui/components";

const { View, ScrollView } = ReactNative;

export default function Settings() {
    useProxy(storage);

    return (
        <ScrollView>
            <View>
                <Forms.FormInput
                    label="Whitelisted User IDs"
                    value={storage.whitelistedIds ?? ""}
                    onChange={v => storage.whitelistedIds = v}
                    placeholder="Enter user IDs separated by commas"
                    note="User IDs to stalk (separated by commas)"
                />
                <Forms.FormSwitchRow
                    label="Track user profile changes"
                    value={storage.trackUserProfileChanges ?? true}
                    onValueChange={v => storage.trackUserProfileChanges = v}
                    note="Show notification for 'user profile changed'"
                />
                <Forms.FormSwitchRow
                    label="Track typing indicators"
                    value={storage.trackStartedTyping ?? true}
                    onValueChange={v => storage.trackStartedTyping = v}
                    note="Show notification for 'user started typing'"
                />
                <Forms.FormSwitchRow
                    label="Track sent messages"
                    value={storage.trackSentMessage ?? true}
                    onValueChange={v => storage.trackSentMessage = v}
                    note="Show notification for 'user sent a message'"
                />
                <Forms.FormSwitchRow
                    label="Show message contents"
                    value={storage.showMessageBody ?? false}
                    onValueChange={v => storage.showMessageBody = v}
                    note="Include message contents in notification"
                />
                <Forms.FormInput
                    label="Character limit"
                    value={storage.charLimit?.toString() ?? "100"}
                    onChange={v => storage.charLimit = parseInt(v) || 100}
                    placeholder="100"
                    note="Character limit for notifications. Set to 0 for no limit"
                />
                <Forms.FormSelect
                    label="Notification Type"
                    value={storage.notificationType ?? "toast"}
                    onValueChange={v => storage.notificationType = v}
                    options={[
                        { label: "Toast Notifications", value: "toast" },
                        { label: "Alert Dialogs", value: "alert" },
                        { label: "Console Only", value: "console" },
                        { label: "All Methods", value: "all" }
                    ]}
                    note="Choose how you want to receive notifications"
                />
            </View>
        </ScrollView>
    );
} 