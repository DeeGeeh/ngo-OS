# Tampere ES budget demo

`tamperees-budget-2026-demo.csv` contains 127 fictional budget line items for January through September 2026. Each row represents one income or expense category for a project in a month. These are synthetic demonstration figures, not Tampere ES accounts.

Amounts are EUR. `budget_eur` and `actual_eur` are positive amounts; use `flow` to distinguish income from expenses. For totals across both flows, use the separate income and expense columns or `net_eur`. Positive `favorable_variance_eur` means better than budget: higher income or lower expenses. Negative values mean worse than budget. The CSV contains no subtotal rows, so summing the detail does not double-count amounts.

The data includes recurring operations, sponsorship and grant instalments, Founder Night, Hacknight, PöhinäTalk, Campus Builders, community activities and a Stockholm excursion. Summer is quieter; autumn promotion and event costs increase. The Stockholm excursion has lower sponsorship income and higher accommodation and travel expenses than budget.

Upload the CSV using **Add source** in the assistant, then ask:

> Create a Tampere ES budget dashboard for January–September 2026. Show total actual income, actual expenses, net surplus and favorable budget variance. Add monthly income and expense charts, expenses by project, and a table of the ten largest unfavorable variances. Use income_eur, expense_eur, net_eur and favorable_variance_eur for these totals. Label the dashboard as demo data.
