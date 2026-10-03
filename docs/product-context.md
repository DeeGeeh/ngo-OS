# TRES product context

A hackathon internal tool for board members at [TRES](https://tamperees.com/). Replace spreadsheet-based event staffing and scattered communication with one workspace for organizing events and engaging team members.

The main flow: create an event, find suitable volunteers, invite them through Telegram, and manage participation. Team members can also propose events that they want to organize or just help in Maybe a request mark in kanban?

MVP scope:

- Project/Event management with Luma integration (MOCKED AS ITS NOT FREE SO IT WILL BE MOCKED IT NEEDS A FULL 1:1 MOCK FOR THE HACKATHON DEMO SO WE CAN WIN THIS AND GET ALOT OF MONEY TO PAY RENT). Naming standard; Project, never use event. 
- Volunteer management with short profiles, skills, interests, Telegram handles, and LinkedIn links. The workspace assistant suggests suitable volunteers for project roles. Jev is only used to classify Telegram messages as relevant or not relevant.
- Telegram bot for event outreach and coordination. Jev classifies messages for organizational relevance; useful messages enter shared context, while chatter and stickers stay out.
- Google Drive integration to bring existing documents into shared context.
- Gmail/email integration for correspondence and contact context. Start with demo data; connect live email if time permits.
- Agent chat that uses shared context and can act on events, members, and Telegram coordination. Full assistant-ui utilization.
- Lightweight Kanban CRM for contacts and follow-ups. Reuse existing components. ui component for the board npx shadcn@latest add "https://21st.dev/r/uvain/kanban-board"
- Mocked "Connect Claude" and "Connect ChatGPT" buttons in user settings (npx shadcn@latest add "https://21st.dev/r/cnippet-dev/v-card-17"" 
- Volunteers can request to host/help in projects 

Hackathon project so utilize assistant-ui heavily. 

Prioritize one complete communication flow across the existing tools. Authentication comes last if time permits. Video calls, ambient voice recording, and a custom document editor are outside the MVP.
