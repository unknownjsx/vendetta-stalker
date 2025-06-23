# RevengeStalker

A Revenge/Vendetta/Bunny plugin that allows you to stalk users and get notifications when they perform various actions.

## What is this?

This is a converted version of the vc-stalker plugin for mobile Discord client mods (Revenge, Vendetta, Bunny). It allows you to stalk users and receive notifications when they perform various actions across Discord.

## Features

- Notify you when a stalked user does any of the following actions:
  - Sends a message in another channel
  - Edits a message in another channel
  - Deletes a message in another channel
  - Starts typing in another channel
  - Updates their bio / profile picture / global name
  - Creates a thread
  - Joins a server you are in

## Installation

1. Download this repository
2. Place the `revenge-stalker` folder in your Revenge/Vendetta/Bunny plugins directory
3. Enable the plugin in your client's settings
4. Configure the plugin settings as needed

## Configuration

The plugin has several settings you can configure:

- **Whitelisted User IDs**: Enter user IDs separated by commas to stalk
- **Track user profile changes**: Show notifications when users update their profile
- **Track typing indicators**: Show notifications when users start typing
- **Track sent messages**: Show notifications when users send messages
- **Show message contents**: Include message contents in notifications
- **Character limit**: Limit the number of characters shown in notifications
- **Notification Type**: Choose how you want to receive notifications

## Notification Options

The plugin supports multiple notification methods optimized for mobile:

### 1. Toast Notifications (Default)
- Uses the mobile device's native toast system
- Appears briefly at the bottom of the screen
- Non-intrusive and mobile-friendly
- Similar to Android's Toast messages

### 2. Alert Dialogs
- Creates native mobile alert dialogs
- Requires user interaction to dismiss
- Good for important notifications
- Includes "View" button to jump to the message/channel

### 3. Console Only
- Logs notifications to the console only
- Good for debugging or if you prefer minimal notifications
- No visual notifications shown

### 4. All Methods
- Uses all notification methods simultaneously
- Ensures you won't miss any notifications

## Usage

1. Add user IDs to the whitelist in the plugin settings
2. Choose your preferred notification type
3. The plugin will automatically start tracking those users
4. You'll receive notifications when tracked users perform actions
5. Tap on notifications to jump to the relevant message or channel

## Mobile-Specific Features

- **Navigation**: Uses mobile navigation system to jump to messages/channels
- **Touch-friendly**: All interactions optimized for touch input
- **Mobile notifications**: Uses native mobile notification systems
- **Battery efficient**: Optimized for mobile performance

## Notes

- This is a converted version from Vencord (desktop) to mobile client mods
- Compatible with Revenge, Vendetta, and Bunny
- Uses mobile-specific APIs for navigation and notifications
- Some features may work differently due to mobile client limitations
- Toast notifications are the most mobile-friendly option

## Original Plugin

This plugin was converted from [vc-stalker-plugin](https://github.com/zastix/vc-stalker-plugin) by zastix.

## License

Same as the original plugin. 