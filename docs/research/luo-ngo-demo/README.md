# Luo NGO demo opportunities

Research notes: [Luo](luo.md), [NGO workflows](ngo-workflows.md), and [demo differentiation](demo-differentiation.md).

The strongest hackathon concept is a small food-rescue operations tool that turns a messy workbook into a live handoff plan, then recovers when reality changes. Luo's public product story supports this direction: users describe an internal tool, connect existing services, and keep changing the workspace as needs change ([Luo homepage](https://luo.app/); [Building Features docs](https://docs.luo.app/building-features/)). Show one operational problem end to end. Start with hypothetical data, expose uncertain records, make a plan, inject an audience-chosen disruption, and let a coordinator approve the response. Finish with a source-linked account of what was delivered. This is a research-based recommendation, not evidence of an NGO partnership, Luo endorsement, required access, or judging criteria.

## Luo fits a workspace that keeps work moving

Luo describes workspaces that combine pages, dashboards, forms, data, integrations, and an assistant. Its documented build loop is conversational: describe a feature, answer questions, review the result, and request changes while preserving existing data ([Your Workspace docs](https://docs.luo.app/your-workspace/); [Building Features docs](https://docs.luo.app/building-features/)). The platform also describes assistant actions, recurring tasks, and triggers from connected tools, including Google Sheets, Gmail, Google Calendar, and Slack ([The Assistant docs](https://docs.luo.app/the-assistant/); [Integrations docs](https://docs.luo.app/integrations/)).

That suggests a sponsor-relevant pattern: replace the spreadsheet and manual status chasing with a shared operational view, then ask the workspace to add the next useful view. Treat Luo integration as optional until credentials are confirmed. A seeded local dataset keeps the story reviewable while Google Sheets, Calendar, or Slack connections remain conceptual.

The product must show a state change, not only a chat answer. Luo's internal-tools example frames a messy spreadsheet becoming a pipeline whose records update from Gmail and Calendar and whose summary can post to Slack ([Build internal tools](https://luo.app/internal-tools/)). Here, a rescue changes from planned to disrupted to approved to completed, with its reason and evidence visible.

## Exception recovery is the useful difference

Volunteer calendars, self-scheduling, reminders, check-in, hours, exports, donor reports, and food-rescue dispatch already exist in commercial products. Better Impact, POINT, SignUpGenius, and Galaxy Digital describe versions of the standard volunteer-management set ([Better Impact volunteer scheduling](https://www.betterimpact.com/how-we-help/volunteer-scheduling-software-features); [POINT](https://pointapp.org/); [SignUpGenius features](https://www.signupgenius.com/features/); [Get Connected scheduling](https://www.galaxydigital.com/features/volunteer-scheduling-software/)). Food Rescue Hero and Food Rescue US cover many food-rescue basics, including donors, recipients, drivers, safety or time flags, routing, and live field data ([Food Rescue Hero product](https://foodrescuehero.org/our-product/); [Food Rescue US](https://foodrescue.us/food-rescue-us-2/)).

The defensible demo unit is a closed operational loop. An exception changes the plan, the system explains the constraints, a coordinator approves a tradeoff, and completion records update the report. Food rescue joins donor windows, recipient capacity, vehicle fit, volunteer availability, safe handling, and actual weight. Second Helpings Atlanta documents vehicle and supply needs, substitute drivers, same-day cancellations, and weighing every rescue. Chicago Food Rescue documents direct donor-to-partner handoffs ([Second Helpings Atlanta volunteer FAQs](https://secondhelpingsatlanta.org/faqs-volunteer-opportunities/); [Chicago Food Rescue food donors](https://www.chicagofoodrescue.org/food-donors)).

Keep three states visible: planned, changed, and completed. Every recommendation should say what it satisfies, what it costs, and what remains uncovered. Required training, food-safety, and recipient-acceptance rules are hard constraints. Coordinator approval selects among feasible plans; it cannot override required training or food safety. The demo can use a tiny graph of three donors, two recipient sites, four volunteers, and two vehicles. Those numbers are hypothetical demo data, not an operational benchmark.

## Four flows can make the story memorable

### 1. Save tonight's food rescue

**Problem and user.** A food-rescue coordinator has one workbook covering donor pickups, recipient windows, volunteers, vehicle capacity, and route notes. A volunteer driver uses the second view. All demo records should be synthetic.

**Demo beats.** Import the workbook and flag inconsistent availability, missing vehicle details, and uncertain rows. Build a timeline for each donor-to-recipient chain. The audience clicks “driver cancelled” and adds a late perishable donation. The original plan becomes invalid. Offer two or three replans with qualified driver, vehicle fit, cutoff time, tradeoff, and uncovered need. The coordinator approves one. A standby volunteer accepts it, the recipient confirms the handoff, and the delivered quantity updates the evidence view.

**Memorable moment.** Show an explicit diff: “Original route invalid. Replacement preserves the 17:30 receiving cutoff and cold-chain vehicle requirement, adds 11 minutes, and leaves one donation uncovered.” The audience controls the disruption, and the recovery works.

**Hackathon core and stretch.** The core is seeded import, normalization, deterministic eligibility and capacity checks, a small replan, approval history, and working in-app mutations through synthetic volunteer and recipient role views: the volunteer accepts the assignment, then the recipient checks in and confirms the handoff. The stretch is asking the assistant to add a late-donation view or qualified-standby filter while preserving records, then produce a source-linked report. Simulate external notifications, maps, GPS, credentials, and routing APIs, but keep the state transitions real. Do not claim meals, carbon impact, or euro value without a real conversion. Never weaken a food-safety or qualification requirement.

### 2. Recover when event attendance doubles

**Problem and user.** An event coordinator has a CSV roster with roles, arrival times, skills, accessibility needs, supplies, and sponsor resources. FIRST's official guide shows coordinators exporting a roster to Google Sheets or Excel, building pivots, and filtering roles, certifications, dietary restrictions, shirt sizes, and arrival times. Multi-role volunteers appear multiple times ([FIRST attendance and event planning report guide](https://info.firstinspires.org/hubfs/web/volunteer/guides/Volunteer-Numbers-at-a-Glance-Attendance-Checklist-Report.pdf)).

**Demo beats.** Import the roster and generate a run-of-show, arrival waves, role coverage, meal counts, and supplies. Two hours before opening, double attendance and mark a lead sick. Show the bottleneck. Offer redeploying a qualified person, opening a backup cache, shortening a program block, or sending targeted requests. Only acceptances change coverage. Publish a revised run sheet and close from actual check-ins.

**Memorable moment.** The tool refuses to place an unqualified volunteer into a restricted role and shows the gap. The coordinator chooses a safe compromise and sees its downstream effect before approval.

**Hackathon core and stretch.** The core is one event, coverage calculation, what-if panel, approval, accept or decline states, and a before-and-after run sheet. The stretch is a conversational readiness view and sponsor-resource allocation. Simulate RSVP feeds, messages, inventory scans, payroll, and certification systems. Keep accessibility and safeguarding constraints human-reviewed.

### 3. Keep a pantry moving during a stock shortage

**Problem and user.** A check-in volunteer, stock lead, and coordinator share a live distribution board. St Mark's instructions describe finding a family in a spreadsheet, completing missing fields, marking pickup, identifying first-time households, and managing box, bread, miscellaneous-item, and floater roles. Open Table describes live spreadsheet order tracking and distinct ordering, loading, and traffic roles ([St Mark food pantry](https://stmark911.org/food-pantry.php); [Open Table volunteer roles](https://www.opentable.org/volunteer/)).

**Demo beats.** Check in a household on a phone view and update the queue and stock. Add a duplicate pickup or inject a shortage. The coordinator sees the constrained item or role and chooses a permitted substitute, reassigns a floater, or records an unresolved request. Fulfillment updates the household and stock views.

**Memorable moment.** Three role views change from one action. The stock lead sees the count fall, the check-in volunteer sees the next action, and the coordinator sees the queue risk. Eligibility and fairness decisions stay human. The tool must not score vulnerability or alter allocation rules silently.

**Hackathon core and stretch.** The core is check-in, stock counts, duplicate flags, role coverage, one exception action, and actual fulfillment. The stretch adds expiry and temperature fields, multilingual needs, and a branch view. Simulate identity systems, notifications, translation services, and demand forecasts. Do not claim queue-time or stockout improvements without a baseline.

### 4. Explain what the donation actually did

**Problem and user.** A donor or coordinator asks where a batch of donated goods went. The answer must follow received, allocated, and delivered records. Products such as Bloomerang already offer donor segmentation, dashboards, scheduled reports, and plain-language reporting ([Bloomerang reporting and analytics](https://bloomerang.com/features/reporting-and-analytics)).

**Demo beats.** Open the completed rescue or distribution record. Trace the donation to the destination and handoff confirmation. Generate a draft update with clickable source rows and an “incomplete” state when evidence is missing. Let a coordinator review and export it. Do not send an outbound message.

**Memorable moment.** The report refuses to turn a promise into an impact claim. A missing delivery confirmation stays visible, while confirmed quantities link back to the received and delivered records.

**Hackathon core and stretch.** The core is a linked evidence trail and reviewable export. The stretch is a scheduled donor draft or branch comparison from the same completed records. Simulate donor contacts, accounting, payment processors, tax receipts, and impact conversions. Keep restricted funds and in-kind valuation human-approved.

## Build the rescue first, then prove it

Use Flow 1 as the product and add Flow 4 as its ending. The smallest data model has a handoff, a person or partner, and a resource or lot. The interface needs an operations board, decision panel, volunteer view, recipient confirmation, and evidence drawer.

For a compact three-minute pitch, open with the messy workbook and ask, “Can tonight's food still reach the pantry?” Show the initial plan, let the audience cancel the driver and add the late donation, compare options, approve one, and switch to the volunteer and recipient views. End with one confirmed delivery and one incomplete record in the evidence report. If time remains, ask for a new Luo-like view and show the data preserved. Label every record “hypothetical demo data” and state which integrations are conceptual.

The research supports a focused operations product, not a general NGO database. Its value is the decision trail around a changing handoff: the coordinator sees facts, the system checks boundaries, a person approves the tradeoff, and the report reflects what happened. The pattern can later cover an event or pantry. Measure what the prototype can show: routes covered, constraints satisfied, acceptances, completed handoffs, and missing evidence. The public sources establish operational complexity and spreadsheet workflows, but not baseline error rates, time savings, or the Luo rubric. Those claims belong after an NGO operator supplies real data.
