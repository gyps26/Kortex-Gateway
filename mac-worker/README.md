# macOS Distributed iMessage Gateway - Worker Daemon

This directory contains the Local macOS Worker script. This script acts as an edge device that sends and receives iMessages (or SMS via Text Forwarding) by commanding the native macOS Messages app via AppleScript and polling the internal SQLite `chat.db`.

## Requirements
- macOS environment (e.g. MacBook Air M1).
- Node.js 18+ installed on the host.
- Full Disk Access granted to `Terminal.app` or `Node` to read `~/Library/Messages/chat.db`.
- The Messages up signed in with an active Apple ID. 

## Installation
1. Move this `mac-worker` folder to the target macOS profile.
2. Run `npm install` inside the folder.
3. Create a `.env` file containing the environment variables.

### Environment Variables (.env)
```env
# A unique identifier for this macOS Profile
WORKER_ID="mac_profile_1"

# The public URL of the Central Cloud Hub API
API_URL="https://YOUR_NEXTJS_APP_URL/api/worker"

# Secret token that matches the Central Cloud Hub for authentication
API_SECRET="my_super_secret_for_mac_workers"
```

## Running the Daemon
You can run it manually via `npm start`.
For a production setup, we highly recommend using `pm2` to keep the daemon running continuously in the background.

```bash
npm install -g pm2
pm2 start worker.js --name "imessage-worker"
pm2 save
```

## Rate Limits & Error Handling
- The Central Cloud Hub restricts each profile to 50 outbound messages per day.
- A randomized delay between 15 to 45 seconds is enforced natively after every sent message to emulate human input pacing.
- Read locks (`SQLITE_BUSY`) are handled through exponential backoff polling, preserving memory and ensuring thread-safety across multiple instances.
- Recurring AppleScript delivery failures will flag the Worker as `inactive` on the Hub to preserve sender reputation.
