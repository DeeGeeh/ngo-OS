# Data sources

The data library stores imported source metadata, accepted snapshots, and saved dashboard definitions in the local SQLite database. Workspace reads do not include source rows. The assistant reads a bounded source sample through `inspectSource` and uses `saveDashboard` for server-computed results.

`WORKSPACE_AI_MODEL` defaults to `openai/gpt-6.1-sol`. This model has been tested with the nested Metric, Chart, and Table dashboard schemas.

## Supported sources

- CSV uploads use the file name as the source name. Re-uploading with the same attachment ID replaces the snapshot and keeps the source ID.
- Public Google Sheets use the official CSV export endpoint. The source keeps the original URL and the selected `gid` tab.
- Private Google Sheets use the official Google Sheets SDK with a service account.
- Google Drive CSV files use the official Google Drive SDK with a service account.

The source parser accepts quoted CSV fields and UTF-8 byte order marks. It keeps a column as text when any non-empty value is text, so identifiers such as `0012` keep their leading zeroes.

## Configure private Google access

Set `GOOGLE_SERVICE_ACCOUNT_JSON` to the service account JSON object. Share each private Sheet or Drive CSV file with the service account email in `client_email`. The service account needs read access to the file. Personal Google OAuth is not configured.

Public Sheets do not need credentials. A private Sheet or Drive CSV returns a clear configuration error when the variable is missing or invalid.

## Limits

The parser rejects a source before saving it when it exceeds any of these limits:

- 2 MiB of CSV data
- 10,000 rows
- 100 columns
- 100,000 cells
- 10 imported sources
- 10 MiB of stored source snapshots

Saved dashboards contain up to 12 blocks. A chart contains up to 100 groups, and a table returns up to 100 rows.

## Refresh behavior

CSV uploads use their accepted snapshot until they are replaced. Remote sources refresh when a dashboard opens after 60 seconds, when the dashboard polls or receives focus, and when a user selects **Refresh**. The manual action forces a new read.

A successful read creates a new snapshot only when the table changed. A failed read keeps the last accepted snapshot and marks the source stale with the error. A source without an accepted snapshot is unavailable. Dashboard aggregates run on the server and return an explicit no-data result when a numeric query has no values.
