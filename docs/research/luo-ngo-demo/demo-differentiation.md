# Demo differentiation for a spreadsheet based NGO operations tool

## 1. What existing products already cover

### Takeaway

Volunteer recruitment, self scheduling, reminders, check in, hours, exports, donor reporting, and even food rescue dispatch are already productized. A demo that only imports a sheet, creates shifts, sends reminders, or produces a dashboard will read as a compact clone of established tools.

### Cited Findings

- Better Impact already offers a staff and volunteer shift calendar, role preferences and availability, self scheduling, email/SMS reminders, and scheduling analytics/reporting. [Better Impact volunteer scheduling](https://www.betterimpact.com/how-we-help/volunteer-scheduling-software-features)
- POINT already covers customizable recruitment flows, volunteer profiles, programs, groups, assigning/reserving shifts, group scheduling, ongoing opportunities, QR/kiosk check in, automatic and self submitted hours, reports, exports, SMS/email/push communication, and calendar integrations. [POINT platform](https://pointapp.org/)
- SignUpGenius already supports recurring sign ups, custom questions, edit/swap, calendar sync, automatic reminders, volunteer hours reports exported to Excel, multiple admins, and payment/donation tracking with exports. [SignUpGenius features](https://www.signupgenius.com/features/)
- Galaxy Digital/Get Connected explicitly supports skills, prerequisites, and availability based scheduling; multi location opportunities; self scheduling; check in; hours; waivers; event management; groups; and volunteer profiles with skills and interests. [Get Connected scheduling](https://www.galaxydigital.com/features/volunteer-scheduling-software/)
- Food Rescue Hero already automates volunteer scheduling, food donor coordination, rescue tracking, and real time dashboards. It describes multi stop rescue creation, finding distribution partners and volunteers, color coded statuses, food safety time flags, and real time volunteer entered data. [Food Rescue Hero home](https://foodrescuehero.org/), [Food Rescue Hero product](https://foodrescuehero.org/our-product/)
- Food Rescue US already connects donors, volunteer rescuers, and receiving agencies through a web app; volunteers can choose rescues by day, time, or location and receive pickup/delivery instructions. [Food Rescue US](https://foodrescue.us/food-rescue-us-2/)
- Food Rescue US's 2024 impact report says its product work included improved scheduling, Quick Response Teams for last minute rescues, smarter planning/routing, matching donations with agency needs, and expanded reporting. [Food Rescue US 2024 impact report](https://foodrescue.us/wp-content/uploads/2025/08/FRUS_2024_ImpactReport_Web.pdf)
- Goodr describes technology and logistics that track surplus food from pickup to donation and provide real time social and environmental impact analytics. [Goodr story](https://goodr.co/our-story/)
- Bloomerang already offers plain language report generation, dynamic donor segmentation, dashboards, scheduled reports, and volunteer impact reporting. [Bloomerang reporting and analytics](https://bloomerang.com/features/reporting-and-analytics)

### Inferences

- The credible product gap for a hackathon demo is not "NGO CRM plus AI" or basic scheduling. The memorable unit is a closed loop operational decision: a real world exception changes the plan, the system explains the tradeoffs, a coordinator approves a revised plan, and the final report is based on completed records rather than the original promise.
- Food rescue is a particularly rich single domain because one operation visibly joins perishable time windows, donor supply, recipient demand/capacity, volunteer availability/skills, vehicle capacity, route order, check in evidence, and impact reporting. Food Rescue Hero and Food Rescue US demonstrate that the underlying domain is real and operationally complex; the prototype should not claim to have invented food rescue dispatch.
- “Ask a question and get a report” is weak differentiation by itself: Bloomerang markets that exact interaction. If AI appears, it should recommend or explain a state changing operational action using visible records and constraints, with a human approval step.

### Gaps

- Product marketing pages do not establish how each vendor handles a specific sequence of simultaneous exceptions, such as a driver cancellation plus an early recipient closure plus a new donor. Avoid claiming that any vendor cannot do this; show the prototype's value as a proposed workflow and explain its scope.
- I found no reliable source on hackathon judging criteria, so recommendations below are based only on the supplied challenge.

## 2. What would make the live demo meaningfully different

### Takeaway

Make the visible hero moment a transparent replan under pressure, not the initial schedule. Start from a deliberately messy operational spreadsheet, turn it into a small connected model, inject one or two believable changes, and make the coordinator choose among feasible responses while preserving the reason and evidence trail.

### Cited Findings

- Better Impact, POINT, SignUpGenius, and Get Connected all publicly describe the baseline functions a volunteer coordinator expects: shifts, availability, reminders, check in, hours, groups, and reporting. [Better Impact](https://www.betterimpact.com/how-we-help/volunteer-scheduling-software-features); [POINT](https://pointapp.org/); [SignUpGenius](https://www.signupgenius.com/features/); [Get Connected](https://www.galaxydigital.com/features/volunteer-scheduling-software/)
- Food Rescue Hero calls out food safety time flags, multi stop rescues, distribution partner selection, volunteer finding, and real time field data. [Food Rescue Hero product](https://foodrescuehero.org/our-product/)
- Food Rescue US specifically calls out Quick Response Teams and smarter planning/routing to match donations with agency needs. [Food Rescue US 2024 impact report](https://foodrescue.us/wp-content/uploads/2025/08/FRUS_2024_ImpactReport_Web.pdf)
- POINT and Bloomerang both position automatic reports and impact analytics as standard capabilities. [POINT reporting](https://pointapp.org/nonprofit-features-category/report/); [Bloomerang reporting](https://bloomerang.com/features/reporting-and-analytics)

### Inferences

- The prototype should visibly preserve three states: planned, changed, and completed. That lets a reviewer see what the coordinator knew, what changed, which constraints were honored or relaxed, who approved the choice, and what actually happened.
- A good recommendation card should contain the proposed action, the constraints satisfied, the tradeoff, and the unresolved gap. For example: “Assign the qualified standby driver to Rescue B; preserves the 17:30 pantry cutoff and cold-chain vehicle capacity; adds 11 minutes to the route.” If no qualified driver is available, mark the assignment infeasible until the required training is verified. This is a design example, not a claimed vendor limitation.
- Importing a spreadsheet is useful as the entry point only if it exposes a real operational transformation: duplicate volunteer names, free text availability, inconsistent units, and missing recipient capacity become flagged records that affect the plan. A generic CSV upload animation adds little.
- For a 2–4 minute demo, use one domain and one small scenario. Three donors, two recipient sites, four volunteers, two vehicles, and three changes are enough to make the dependency graph legible.

### Gaps

- Without a real NGO operator interview, exact constraints and terminology are assumptions. Use clearly labeled demo data and avoid claiming that the selected windows, capacities, or conversion factors represent a real organization.
- Route optimization, SMS delivery, mapping, GPS, and identity/background checks are external or simulated for a hackathon sized build. They should be shown as boundaries, not implied to be production ready.

## 3. Three ambitious 2–4 minute demo narratives

### Takeaway

Lead with a food rescue control tower, keep a community event contingency flow as the accessible alternative, and use donation/resource allocation as the board-facing alternative. The first has the strongest operational drama and the clearest reason to connect otherwise separate spreadsheet tabs.

### Cited Findings

- Food rescue platforms already expose the ingredients for a credible scenario: donors, agencies, volunteer drivers, multi stop rescues, time/safety flags, planning/routing, and real time field data. [Food Rescue Hero product](https://foodrescuehero.org/our-product/); [Food Rescue US app](https://foodrescue.us/food-rescue-us-2/)
- General volunteer systems already make event sign up, self scheduling, check in, reminders, and reporting familiar interactions. [POINT platform](https://pointapp.org/); [SignUpGenius features](https://www.signupgenius.com/features/); [Get Connected scheduling](https://www.galaxydigital.com/features/)
- Donor systems already provide donor segmentation and report generation, so a donation story should demonstrate allocation and execution rather than another donor table or natural language report. [Bloomerang reporting and analytics](https://bloomerang.com/features/reporting-and-analytics)

### Inferences

#### Candidate A — “The 4:40 PM rescue that almost fails” (recommended)

- Trigger: import a messy spreadsheet containing tonight's donor pickups, pantry receiving windows, volunteer availability/skills, vehicle capacities, and a recurring rescue plan.
- Visible operational change: normalize the rows into a small live map/timeline; show each pickup-to-recipient chain, cold-chain/time-window status, capacity use, and open coverage gaps; generate a plan with explicit constraints.
- Surprising mid-demo exception: the assigned driver cancels 25 minutes before pickup while a bakery adds a late, perishable donation and the nearest pantry moves its closing time earlier. The system marks the original plan invalid and offers two or three feasible replans, each with its cost/tradeoff and an unresolved gap.
- Outcome: the coordinator approves one replan; the volunteer view receives a simulated assignment change; check in and delivery confirmation move the rescue from planned to completed; the impact view is generated from actual delivered quantity and recipient, with any missing evidence called out.
- Hackathon sized core: seeded spreadsheet import, deterministic constraint checks, small graph of pickups/recipients/volunteers/vehicles, transparent replan options, approval/audit event, simulated check in and completed report. Simulated/external: SMS, maps/routing API, GPS, background checks, food safety certification verification, real donation/impact conversion factors.
- Most important failure risk: a fake “AI optimized route” that cannot be explained or is too complex to read. Keep the route tiny, show the constraints and arithmetic, and allow the coordinator to choose the final plan.
- Why this survives the baseline comparison: the initial shift schedule and report are table stakes; the hero moment is a human approved exception loop that links supply, demand, capacity, timing, and evidence across spreadsheet tabs. Food Rescue US and Food Rescue Hero already cover parts of this domain, so present this as a focused prototype for transparent cross-record replanning, not a replacement claim.

#### Candidate B — “Doors open in two hours, attendance doubled”

- Trigger: import an event spreadsheet with roles, tasks, supplies, volunteer commitments, accessibility requirements, arrival times, and sponsor-provided resources.
- Visible operational change: convert the rows into a run-of-show with task coverage and risk flags; show which roles are uncovered, which supplies are below the updated attendance threshold, and which trained volunteers can legally or safely move.
- Surprising mid-demo exception: expected attendance doubles and one lead volunteer reports sick. The coordinator chooses between moving people from low-risk tasks, opening a nearby backup supply cache, or shrinking a program block; the system explains the downstream coverage and asks for approval.
- Outcome: publish a revised run-of-show and targeted volunteer asks; simulate two acceptances and one refusal; close the event with attendance, hours, unmet tasks, and resource usage based on check in records.
- Hackathon sized core: one event, task/skill/attendance model, coverage calculation, what-if panel, approval log, simulated accept/decline, final event report. Simulated/external: ticketing/RSVP integrations, real messages, inventory scanning, payroll or certification checks.
- Most important failure risk: it becomes a polished event checklist with no distinctive operational depth. Anchor every change to a visible constraint—capacity, accessibility, training, arrival window, or scarce resource—and show the cascading consequence.
- Why this survives the baseline comparison: SignUpGenius and volunteer management suites already handle sign ups, reminders, and hours. The prototype's point is contingency coordination across tasks and resources, not event registration. [SignUpGenius](https://www.signupgenius.com/features/); [Get Connected](https://www.galaxydigital.com/features/volunteer-scheduling-software/)

#### Candidate C — “A restricted gift arrives while the need shifts”

- Trigger: import a spreadsheet with donations (cash and in kind), sponsor restrictions, promised resources, program requests, volunteer capacity, delivery deadlines, and recipient demand.
- Visible operational change: show the current resource graph and let the coordinator model an incoming restricted gift or donated pallet; the system highlights which requests it can satisfy, which restrictions prevent an attractive allocation, and which delivery/volunteer slots become bottlenecks.
- Surprising mid-demo exception: a sponsor withdraws a vehicle/resource or a recipient site reports lower capacity. The system rolls back the affected allocation, presents the smallest feasible set of changes, and marks the remaining unmet need instead of silently reallocating restricted resources.
- Outcome: approve an allocation, create the fewest necessary operational tasks, record the sponsor/donor acknowledgement, and generate a board-ready trail showing committed, delivered, and still-unmet resources.
- Hackathon sized core: resource/request/restriction model, what-if allocation, deadline/capacity checks, approval history, and a final committed-vs-delivered report. Simulated/external: payment processor, accounting/CRM sync, legal donor restrictions, tax receipts, actual valuation of in-kind goods.
- Most important failure risk: the demo implies accounting or grant compliance accuracy from toy data. Keep the financial layer explicitly operational, require human approval, show source rows and unresolved restrictions, and avoid invented dollar or impact claims.
- Why this survives the baseline comparison: donor CRMs already handle donor data, segmentation, and reporting. The differentiator is tying a contribution to scarce operational capacity and preserving a decision trail when conditions change. [Bloomerang](https://bloomerang.com/features/reporting-and-analytics); [Goodr](https://goodr.co/our-story/)

### Gaps

- These are proposed demo narratives, not evidence that the described workflows are absent from commercial products. Existing food rescue and volunteer platforms may support more automation than their public pages describe.
- Do not quote platform marketing metrics as expected results for the prototype. Report only seeded demo outcomes, and label any food, carbon, volunteer-hour, or dollar conversion as a configurable assumption unless sourced from the actual organization.
- If time is tight, build Candidate A's state model and exception loop, then use static simulated messages and a small deterministic planner. Add external maps, SMS, and integrations only when they make the live story clearer rather than because they sound ambitious.
