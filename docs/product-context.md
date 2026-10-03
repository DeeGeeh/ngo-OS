# TRES product context

A hackathon internal tool for board members at [TRES](https://tamperees.com/). Replace spreadsheet-based event staffing and scattered communication with one workspace for organizing events and engaging team members.

The main flow: create an event, find suitable volunteers, invite them through Telegram, and manage participation. Team members can also propose events.

MVP scope:

- Event management with Luma integration, handled by a separate team owner.
- Volunteer management with short profiles, skills, interests, Telegram handles, and LinkedIn links. Jev suggests suitable volunteers for event roles.
- Telegram bot for event outreach and coordination. Jev classifies messages for organizational relevance; useful messages enter shared context, while chatter and stickers stay out.
- Google Drive integration to bring existing documents into shared context.
- Gmail/email integration for correspondence and contact context. Start with demo data; connect live email if time permits.
- Agent chat that uses shared context and can act on events, members, and Telegram coordination.
- Lightweight Kanban CRM for contacts and follow-ups. Reuse existing components.

Prioritize one complete communication flow across the existing tools. Authentication comes last if time permits. Video calls, ambient voice recording, and a custom document editor are outside the MVP.
