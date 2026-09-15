

| Decision | Proposed choice |
| ----- | ----- |
| **Database engine** | PostgreSQL |
| **Database version** | Stable PostgreSQL version |
| **Database driver** | PostgreSQL driver |
| **Connection management** | Connection pooling |
| **ORM/query approach** | Mostly ORM with some SQL if need |
| **Migration system** | ORM-native framework |
| **Seed approach** | Deterministic application-level seed script |
| **Local development** | Docker Compose |
| **Table names** | plural `snake_case` |
| **Column names** | `snake_case` |
| **Primary keys** | `id` |
| **Foreign keys** | `<entity>_id` |
| **Index names** | `idx_<table>_<column>` |
| **Unique constraint names** | `uq_<table>_<column>` |
| **Identifier type** | BIGINT |
| **Database timestamps** | Native timestamp type |
| **API timestamp representation** | ISO 8601 |
| **Timezone** | UTC |
| **Character encoding** | UTF-8 |
| **Boolean representation** | Native BOOLEAN |
| **Deletion behavior** | Mixed by entity/relationship |

