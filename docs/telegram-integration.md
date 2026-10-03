# Telegram integration

The integration uses two Telegram identities.

- The bot belongs in the one configured main group. It receives webhook updates and stores messages that the Jev classifier marks as workspace relevant.
- The connected organizer account uses GramJS for project groups, member linking, invitations, member reads, messages, and invite links.

Set these server environment variables.

```text
TELEGRAM_API_ID=
TELEGRAM_API_HASH=
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_MAIN_CHAT_ID=
TELEGRAM_SESSION_ENCRYPTION_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

`TELEGRAM_SESSION_ENCRYPTION_KEY` must be 64 hexadecimal characters. Configure the OpenRouter key used by the existing assistant for Jev relevance classification. Point Telegram's webhook to `/api/telegram/webhook` and send the configured secret in `X-Telegram-Bot-Api-Secret-Token`.

Add the bot to the one main group, grant it permission to read messages, and use BotFather to disable privacy mode when the bot must receive ordinary group messages. Register the webhook with `setWebhook` using the same `secret_token` value as `TELEGRAM_WEBHOOK_SECRET`. Clerk publishable and secret keys must be configured so the connected organizer session stays scoped to the authenticated workspace user.

The Bot API request has this shape.

```text
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<PUBLIC_APP_URL>/api/telegram/webhook&secret_token=<WEBHOOK_SECRET>
```

The organizer login stores only an encrypted GramJS session on the server. Telegram may require a second request for the account's two step verification password. Telegram privacy settings can return per person `invite_required` outcomes instead of adding everyone directly.

The UI and assistant share the same Telegram facade. They can link workspace members, create or reuse a project supergroup, invite selected members, read actual members and recent messages, send project messages, and create fallback invite links. A direct invite can remain blocked by a member's privacy settings, so the result names each member and reports `Added`, `Already in group`, `Needs invite link`, or `Could not add`.

Reconnect the same organizer account after an expired session. A different account is rejected so saved Telegram access hashes and linked identities cannot silently transfer to another person. Project group creation is guarded by a durable local claim. Definitive Telegram rejections release the claim. An unknown network or persistence result keeps the claim for manual reconciliation instead of risking a duplicate remote group.

Automated verification uses an isolated SQLite database and mocked Telegram responses. A real setup needs Telegram API credentials, bot permissions and privacy settings, Clerk authentication, and the webhook registration above.
