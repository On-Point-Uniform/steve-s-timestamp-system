# Entity Schemas

## TimestampEvent

Stores every clock-in, clock-out, and break event recorded by a staff member.

| Field            | Type        | Required | Default    | Notes                                      |
|------------------|-------------|----------|------------|--------------------------------------------|
| id               | string      | auto     | —          | Platform-generated primary key             |
| created_date     | datetime    | auto     | —          | Platform-generated creation timestamp      |
| updated_date     | datetime    | auto     | —          | Platform-generated update timestamp        |
| session_number   | number      | ✅       | —          | Groups all events belonging to one shift   |
| event_name       | string enum | ✅       | "Stamp In" | One of: "Stamp In", "Break Start", "Break End", "Stamp Out" |
| break_number     | number      | ❌       | null       | Counter for which break this is (1, 2, …)  |
| full_timestamp   | datetime    | ✅       | —          | ISO-8601 moment the event was recorded     |
| status_after     | string      | ✅       | —          | One of: "Working", "On Break", "Stamped Out" |
| date             | date        | ✅       | —          | YYYY-MM-DD extracted from full_timestamp   |
| time             | string      | ✅       | —          | HH:MM:SS (24-hour) extracted from full_timestamp |
| log_sequence     | number      | ❌       | —          | Sequential audit-log ID, incremented in the client |

### Relationships
- No foreign keys to other entities in this app.
- `session_number` is a logical grouping key: all events with the same value belong to one shift.
- `break_number` is meaningful only when `event_name` is "Break Start" or "Break End".

---

## ExternalAuthToken  *(external — On Point Portal app)*

Owned by the On Point Portal (appId: `6a5545ad446ace2ec9960075`). Read/written via `portalBase44` client, not this app's database.

| Field         | Type     | Required | Notes                                              |
|---------------|----------|----------|----------------------------------------------------|
| id            | string   | auto     | Platform-generated primary key                     |
| token         | string   | ✅       | Opaque one-time-use token passed in the callback URL |
| used          | boolean  | ✅       | Set to `true` after the token is consumed          |
| expires_at    | datetime | ✅       | Token is invalid after this time (5-minute window) |
| employee_name | string   | ❌       | Display name of the authenticated employee         |
| employee_id   | string   | ❌       | Identifier of the employee in the portal system    |
| role          | string   | ❌       | Employee role (e.g. "staff")                       |