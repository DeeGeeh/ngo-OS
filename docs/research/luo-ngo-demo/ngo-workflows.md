# NGO operations from spreadsheets

## 1. What operational facts do primary sources show?

### Food rescue is a chain of timed handoffs, not just a volunteer list

#### Takeaway

Food rescue coordinators must join donor availability, recipient capacity, driver/vehicle fit, food safety, route timing, and post-pickup measurement. The operational object is a rescue handoff with exceptions, not a person assigned to a generic shift.

#### Cited Findings

- Second Helpings Atlanta runs rescues seven days a week, mostly 7:30–11:00, with a typical pickup-to-delivery route taking about 90 minutes; some routes require an SUV or minivan, while others fit a small car. [Second Helpings Atlanta volunteer FAQs](https://secondhelpingsatlanta.org/faqs-volunteer-opportunities/)
- Second Helpings asks drivers for a 12-month monthly commitment, keeps substitute drivers for people who cannot commit, requires food to be weighed and reported after every rescue, and tells drivers to call the coordinator for a same-day cancellation. [Second Helpings Atlanta volunteer FAQs](https://secondhelpingsatlanta.org/faqs-volunteer-opportunities/)
- Route-specific exceptions matter: some routes need coolers or ice packs, some donors have dedicated bins, donor staff may not load vehicles, and partner agencies may or may not unload. [Second Helpings Atlanta volunteer FAQs](https://secondhelpingsatlanta.org/faqs-volunteer-opportunities/)
- Chicago Food Rescue accepts both repeating and one-time rescues, asks donors to hold food at a safe temperature, and sends the volunteer directly from donor to nonprofit partner. It says donor data can include weight, meal equivalent, and number of rescues. [Chicago Food Rescue food donors](https://www.chicagofoodrescue.org/food-donors)
- Boulder Food Rescue describes a just-in-time model with 28+ donating businesses, 40+ recipient sites, daily volunteer transport, and delivery to recipients within 24–48 hours. Its volunteer logistics software tracks schedules, pickup data, donor receipts, and absences. [Boulder Food Rescue how it works](https://www.boulderfoodrescue.org/how-it-works/); [Boulder Food Rescue logistics software](https://www.boulderfoodrescue.org/start-your-own-food-rescue/)
- Sharing Excess says its volunteers pick up and weigh donations, transport them to hunger-relief organizations, sort produce into edible versus compostable, and load regular partner pickups at its Sharehouse. [Sharing Excess volunteer opportunities](https://www.sharingexcess.com/get-involved/volunteer)
- A vendor case study says Rethink Food was coordinating 40,000+ weekly meals across New York and Miami with spreadsheets and disconnected SaaS tools; this is useful direct evidence of the described pain, but it is vendor-reported and should not be treated as independent validation. [Digitizing case study](https://www.digitizing.io/work/rethink-food)

#### Inferences

- A useful demo record should hold donor, recipient, pickup window, food type/quantity, vehicle requirements, supplies, driver, route status, actual weight, and exception notes together. That model is inferred from the route constraints above.
- The most compelling “spreadsheet replacement” moment is a same-day cancellation or quantity mismatch: the coordinator sees which substitute driver and vehicle can cover the route, which destination can accept the load, and whether the safety window still works.

#### Gaps

- The primary organization pages describe the workflow but do not publish a before/after spreadsheet error rate or coordinator-hours saved. Treat those as demo metrics, not established facts.
- The Rethink Food spreadsheet claim comes from its implementation vendor; independent interviews or an Rethink annual report would strengthen it.

### Distribution days combine identity/check-in, household rules, stock constraints, and human service

#### Takeaway

Food pantries have a live operational queue: identify the household, prevent duplicate or incomplete pickup records, apply allocation rules, and keep box/item stock replenished while volunteers fill several roles.

#### Cited Findings

- St Mark United Methodist Church’s distribution instructions tell the check-in volunteer to find the family on a spreadsheet, complete missing fields, mark the pickup, identify first-time households on a “New” tab, and place a household-type sticker on the vehicle. [St Mark food pantry](https://stmark911.org/food-pantry.php)
- The same instructions separate box/bread tables, a miscellaneous table with a three- or four-item limit, and floaters who restock or help carry boxes. [St Mark food pantry](https://stmark911.org/food-pantry.php)
- Open Table says phone orders are updated and tracked on a live spreadsheet, asks for multilingual volunteers, and has more than 200 volunteers each week across pantry, meals, and mobile programs. [Open Table volunteer roles](https://www.opentable.org/volunteer/)
- Open Table documents several distinct distribution roles—taking orders or directing traffic, shopping/loading orders, and loading vehicles—and says its kitchen produced more than 80,000 packaged meals in the prior year. [Open Table volunteer roles](https://www.opentable.org/volunteer/)
- Open Table reports distributing more than 925,000 pounds through its drive-through pantry and mobile programs in the prior year and purchasing key items to meet cultural and dietary needs. [Open Table volunteer roles](https://www.opentable.org/volunteer/)

#### Inferences

- The internal tool should make the spreadsheet row a live case/status record: arrived, new/returning, pickup completed, household category, box assigned, optional-item allowance remaining, and exception/referral.
- A “distribution mode” demo can show a check-in volunteer using a phone, a stock lead seeing remaining boxes/items, and a coordinator seeing which role is understaffed. Those roles are grounded in St Mark and Open Table’s published instructions; the shared interface is a proposed product design.

#### Gaps

- St Mark and Open Table publish the mechanics but not measured queue times, duplicate-pickup rates, or stockout frequency. Any claimed improvement needs to be labeled hypothetical until an organization supplies baseline data.

### Event volunteer readiness requires repeated spreadsheet pivots over personal and safety constraints

#### Takeaway

For a volunteer-run event, the roster is also a readiness and safeguarding dataset: role assignments, language, age, certification, youth-protection clearance, dietary restrictions, accommodations, shirt size, and arrival time all drive different decisions.

#### Cited Findings

- FIRST’s official event guide says its Attendance & Event Planning report contains volunteer names, pronouns, languages, minor/adult status, roles and schedules, shirt sizes, certifications, consent, youth-protection clearance, dietary restrictions, accommodations, and years of service. [FIRST attendance and event planning report guide](https://info.firstinspires.org/hubfs/web/volunteer/guides/Volunteer-Numbers-at-a-Glance-Attendance-Checklist-Report.pdf)
- FIRST explicitly instructs coordinators to export a CSV, open it in Google Sheets or Excel, build pivot tables, filter by day/start/end time, and count dietary restrictions, shirt sizes, and arrival times. Volunteers assigned to multiple roles appear multiple times in the report. [FIRST attendance and event planning report guide](https://info.firstinspires.org/hubfs/web/volunteer/guides/Volunteer-Numbers-at-a-Glance-Attendance-Checklist-Report.pdf)

#### Inferences

- The spreadsheet pain is not merely “hard scheduling”; it is producing several safety/readiness views from one roster without double-counting multi-role volunteers or losing a dietary/accommodation field.
- A strong event demo can start from one roster and instantly produce: check-in list by arrival wave, certified-role coverage, meal counts filtered to the relevant shift, shirt quantities, and a list of unfilled or un-cleared roles.

#### Gaps

- FIRST’s guide documents the manual process and fields, but it does not state how long the pivot work takes or how often errors occur.

### Finland adds distributed branches, partner networks, and food-safety records

#### Takeaway

Finnish food aid is a credible Nordic reference case: local branches operate independently with shops, schools, kitchens, restaurants, and other partners, while the food-safety workflow requires explicit records for expiry, temperature, storage, transport, allocation, and volunteer training.

#### Cited Findings

- The Finnish Red Cross says its food aid is volunteer-based, runs in several towns, and is organized by local branches with shops, schools, central kitchens, lunch restaurants, and other operators. It also combines distributions with communal meals and financial/health advice. [Finnish Red Cross food aid](https://www.redcross.fi/our-work/domestic/food-aid-activities/)
- A 2024 Finnish Red Cross survey says food aid takes several forms across 146 branches, is organized independently by volunteers, may be regular or one-off, and works with stores, schools, central kitchens, lunch restaurants, and other partners. It records approximately 216,000 beneficiary interactions in 2023 and notes decreasing food donations. [Finnish Red Cross national food-aid survey](https://www.redcross.fi/globalassets/13.-uutiset/2024/ruoka-apukysely-2024/frc_final-report-on-a-national-food-aid-survey-2024.pdf)
- The Finnish food-aid own-check template asks organizations to record donor operators and locations, food types, distribution principles, expiry handling, temperature-monitoring method and owner, reception records, transport/equipment, storage and rotation, distribution method, risks, and volunteer training. [Finnish food-aid volunteering guide](https://ruoka-apu.fi/wp-content/uploads/2023/01/Volunteering_in_food_aid_activities.pdf)
- The same guide states that highly perishable food must be frozen or given to the consumer before its use-by date and that frozen products past the use-by date must be distributed frozen/defrosted within two weeks under the documented example rules. [Finnish food-aid volunteering guide](https://ruoka-apu.fi/wp-content/uploads/2023/01/Volunteering_in_food_aid_activities.pdf)

#### Inferences

- A Nordic-ready demo should treat a donation as a lot with an expiry class, temperature checks, storage location, destination, and responsible person, then surface “use first,” “move now,” or “reject/escalate” decisions.
- The distributed-branch structure suggests a lightweight shared operating picture is more valuable than a heavyweight CRM: each branch needs local control while the network needs comparable counts and safety evidence.

#### Gaps

- The Finnish sources establish operational requirements and scale, but they do not say that the organizations currently use spreadsheets for these records. The spreadsheet framing here is a product hypothesis grounded in the documented record burden.

## 2. Which demo workflows are most promising?

### 1. Rescue dispatch board with exception recovery — strongest “wow” flow

- **User:** food-rescue coordinator and volunteer driver.
- **Trigger:** a donor posts a recurring or last-minute pickup, or a driver cancels on the same day.
- **Spreadsheet pain:** schedule, route notes, vehicle capacity, cold-chain supplies, destination acceptance, and post-route weight/reporting live in separate rows, tabs, forms, or messages. The explicit spreadsheet pain is documented for Rethink Food; the multi-constraint join is evidenced by Second Helpings Atlanta, Chicago Food Rescue, and Boulder Food Rescue. [Rethink Food case study](https://www.digitizing.io/work/rethink-food); [Second Helpings Atlanta volunteer FAQs](https://secondhelpingsatlanta.org/faqs-volunteer-opportunities/); [Chicago Food Rescue food donors](https://www.chicagofoodrescue.org/food-donors)
- **Operational decision:** choose a compatible substitute and vehicle, preserve the donor/recipient window, confirm supplies and safe temperature, then record actual quantity and exceptions.
- **Measurable outcome:** known anchors are about 90 minutes for a typical Second Helpings Atlanta route, about 30 minutes for a typical Food Rescue US rescue, and 24–48 hours for Boulder delivery to recipient sites. A demo should measure uncovered routes, time-to-cover, completed handoffs, report completeness, and pounds/meal-equivalents rescued; those are proposed demo metrics. [Second Helpings Atlanta volunteer FAQs](https://secondhelpingsatlanta.org/faqs-volunteer-opportunities/); [Food Rescue US get involved](https://www.communityplates.org/get-involved/); [Boulder Food Rescue how it works](https://www.boulderfoodrescue.org/how-it-works/)
- **Ambitious demo beat:** click “driver cancelled” and let the tool explain a replacement choice using route time, vehicle fit, supplies, and destination capacity, then show the completed handoff and impact receipt.

### 2. Food-drive command center — best bridge between logistics and donor stewardship

- **User:** pantry coordinator working with development and volunteer leads.
- **Trigger:** a community food drive is announced, a pickup window changes, or a driver calls out.
- **Spreadsheet pain:** HOPE Helps explicitly assigns one coordinator to a food-drive spreadsheet and pickup/delivery/drop-off schedule, vendor and food-partner contacts, volunteer driver schedules, closures, cancellations, food inventory, food-vendor reporting, and donor thank-you/in-kind logging. [HOPE Helps pantry coordinator role](https://www.hopehelps.org/were-hiring-food-pantry-coordinator-2/)
- **Operational decision:** decide which driver collects which drive, when and where it lands, whether the pantry can receive/rotate it, and whether development has enough information to issue a thank-you or in-kind record.
- **Measurable outcome:** HOPE Helps states a goal of two food drives per quarter. A demo should track drive completion, pickup coverage, pounds/items received, records ready for thank-you, and days from pickup to inventory entry; only the two-drives-per-quarter goal is known, the rest are proposed metrics. [HOPE Helps pantry coordinator role](https://www.hopehelps.org/were-hiring-food-pantry-coordinator-2/)
- **Ambitious demo beat:** drag a drive pickup to a new day; the system updates the driver, closure warning, pantry receiving capacity, donor record, and thank-you queue in one action.

### 3. Distribution-day live board — best human-centered flow

- **User:** check-in volunteer, distribution lead, and stock/runner volunteer.
- **Trigger:** a household arrives, a new household is added, or a box/optional-item stock level changes.
- **Spreadsheet pain:** the check-in flow explicitly searches a spreadsheet, fills missing data, branches to a “New” tab, and checks off pickup while separate volunteers manage box/bread replenishment and restricted miscellaneous items. [St Mark food pantry](https://stmark911.org/food-pantry.php)
- **Operational decision:** distinguish new versus returning household, mark pickup without duplicating service, apply household/item limits, and route the person or vehicle through the right distribution role.
- **Measurable outcome:** Open Table’s scale provides a credible anchor—more than 200 weekly volunteers and over 80,000 packaged meals in the prior year—while St Mark gives the exact event roles. A demo should measure check-in throughput, duplicate-prevention flags, stockouts, and unresolved exceptions; no source publishes baseline rates. [Open Table volunteer roles](https://www.opentable.org/volunteer/); [St Mark food pantry](https://stmark911.org/food-pantry.php)
- **Ambitious demo beat:** show three synchronized views (arrival/check-in, remaining stock, volunteer coverage) and let a coordinator reassign one floater when a table runs low.

### 4. Expiry-aware cold-chain allocator — strongest operational depth

- **User:** food-aid branch coordinator or food-safety lead.
- **Trigger:** a mixed donation arrives with different expiry classes, temperatures, quantities, and destinations.
- **Spreadsheet pain:** the Finnish own-check template implies many hand-maintained records spanning donor, item class, expiry rule, temperature checks, transport/equipment, storage, rotation, distribution, risk, and training. The source documents the records; it does not claim spreadsheets are in use. [Finnish food-aid volunteering guide](https://ruoka-apu.fi/wp-content/uploads/2023/01/Volunteering_in_food_aid_activities.pdf)
- **Operational decision:** accept/reject or quarantine a lot, choose the destination that can use it in time, assign cold equipment and transport, and surface the responsible person for each check.
- **Measurable outcome:** proposed demo metrics are lots with complete handoff records, food delivered before use-by deadlines, temperature exceptions resolved, and kilograms discarded. These are operationally meaningful but not reported baselines in the cited sources.
- **Ambitious demo beat:** ingest a donation photo/form, classify “use first” lots, allocate them to a nearby event, and show the safety/audit trail a coordinator can hand to a partner or funder.

### 5. Event roster-to-ready-room planner — best event-organizing flow

- **User:** volunteer coordinator for a tournament, community festival, or NGO event.
- **Trigger:** the volunteer roster is closed or updated shortly before the event.
- **Spreadsheet pain:** FIRST’s documented workflow exports a CSV and requires Google Sheets/Excel pivots and filters to answer shirt, dietary, arrival-time, and role questions; multi-role volunteers appear multiple times. [FIRST attendance and event planning report guide](https://info.firstinspires.org/hubfs/web/volunteer/guides/Volunteer-Numbers-at-a-Glance-Attendance-Checklist-Report.pdf)
- **Operational decision:** verify clearance/certification for assigned roles, staff each arrival wave, order meals/shirts/pins, and flag missing accommodation or coverage data.
- **Measurable outcome:** known outputs are counts by dietary restriction, shirt size, service year, and arrival time. A demo should measure time from roster import to ready-room plan, unresolved clearance/coverage issues, and check-in exceptions; source evidence does not provide baseline time or error rates. [FIRST attendance and event planning report guide](https://info.firstinspires.org/hubfs/web/volunteer/guides/Volunteer-Numbers-at-a-Glance-Attendance-Checklist-Report.pdf)
- **Ambitious demo beat:** import one messy roster and generate a staff-facing run sheet plus volunteer-specific schedule, with an explainable warning for every missing certification, dietary need, or double-booking.

## 3. What is known, what is conjecture, and what should the team build first?

### Takeaway

The evidence supports a narrow internal operations product centered on handoffs, exceptions, and live status. The highest-confidence starting point is rescue dispatch plus one distribution or event view; a broad NGO CRM would be conjecture and would dilute the demo.

### Cited Findings

- Explicit spreadsheet use appears in Open Table’s live phone-order spreadsheet, St Mark’s pickup/check-in spreadsheet, HOPE Helps’ food-drive spreadsheet, and FIRST’s CSV-to-pivot workflow. [Open Table volunteer roles](https://www.opentable.org/volunteer/); [St Mark food pantry](https://stmark911.org/food-pantry.php); [HOPE Helps pantry coordinator role](https://www.hopehelps.org/were-hiring-food-pantry-coordinator-2/); [FIRST attendance and event planning report guide](https://info.firstinspires.org/hubfs/web/volunteer/guides/Volunteer-Numbers-at-a-Glance-Attendance-Checklist-Report.pdf)
- Food-rescue organizations explicitly expose the operational fields a demo needs: donor/recipient addresses and contact details, amount, time window, volunteer, vehicle/supplies, actual weight, safe temperature, and donation/impact reporting. [Second Helpings Atlanta volunteer FAQs](https://secondhelpingsatlanta.org/faqs-volunteer-opportunities/); [Chicago Food Rescue food donors](https://www.chicagofoodrescue.org/food-donors); [Food Rescue US FAQs](https://www.communityplates.org/faqs/)
- Finnish Red Cross evidence makes the resource-allocation and safety angle credible in the Nordics: 146 branches, independent local operations, partner networks, decreasing food availability, and documented cold-chain/expiry/transport/volunteer-training records. [Finnish Red Cross national food-aid survey](https://www.redcross.fi/globalassets/13.-uutiset/2024/ruoka-apukysely-2024/frc_final-report-on-a-national-food-aid-survey-2024.pdf); [Finnish food-aid volunteering guide](https://ruoka-apu.fi/wp-content/uploads/2023/01/Volunteering_in_food_aid_activities.pdf)

### Inferences

- **Build first:** a seeded “Today’s operations” board with three linked entities—handoff/shift, person/partner, and resource/lot—and a single exception action. This is enough to demonstrate real operational value without inventing a full domain schema.
- **Best demo narrative:** “A donation arrives, a driver cancels, a coordinator recovers the route, the recipient confirms the handoff, and the impact record is generated.” Add a switch to show a pantry distribution or event roster using the same exception/status pattern.
- **Data model ceiling:** keep demo data hypothetical and label it clearly. Use real organizations only as research references; do not imply that the organizations endorsed the prototype or that unpublished outcome improvements are measured.
- **Vendor evidence caution:** Rethink Food and Table to Table implementation pages are useful examples of scale and software requirements, but their reported benefits come from vendors/implementers. Treat official organization pages and nonprofit/sector research as the validation layer. [Rethink Food case study](https://www.digitizing.io/work/rethink-food); [Table to Table systems case](https://www.passionfruitpartners.com/case-studies/how-table-table-optimized-their-systems-to-support-their-continued-growth)

### Gaps

- I found no reliable public baseline for spreadsheet error rates, staff hours spent reconciling tabs, duplicate distribution records, volunteer no-show rates, or the exact current tools used by Finnish Red Cross branches.
- The sources rarely expose raw operational tables. A final prototype should invent only the minimum synthetic fields needed for the flow and should show the source organization and “hypothetical demo data” label separately.
- Donations and sponsors are visible in HOPE Helps and Chicago Food Rescue workflows through in-kind logging, receipts, partner contacts, and impact reporting, but the cited primary sources do not document a full sponsor pipeline. Add a sponsor CRM only if the challenge requires it after the operational core works.
