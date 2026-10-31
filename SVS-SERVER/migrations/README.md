# Migrations

The changes of the database schema, as scripts ([Alembic](https://alembic.sqlalchemy.org)). `versions/` is the history, one line:

| revision | what |
| --- | --- |
| `0001` | the schema as `create_all` made it, before there were migrations |
| `0002` | a ballot, a tally and its proof are `TEXT` (they outgrew their `VARCHAR`) |

## Day to day

```bash
make migrate                       # bring the database to the latest schema
make migrate-check                 # is it there? (exit 1 if not; changes nothing)
make migration m="add a column"    # write a migration from the change of the models: then READ it, edit it, commit it
make migrate-sql from=0001         # print the SQL a database at 0001 still needs, without running it
```

- **A model changed? Write the migration in the same commit.** CI migrates an empty PostgreSQL and runs `alembic check`: it fails if the models and the migrations disagree. `app/tests/test_migrations.py` does the same on SQLite.
- **Autogenerate is a draft.** It does not see a renamed column (it sees a drop and an add, and the data goes), a change of default, or what only a `UPDATE` can do. Read it.
- **A migration is frozen in time**: it does not import the application (a test checks), it writes the types it means (`sa.String(100)`, not the model's type), so that a later change of the model does not change what an old migration did.
- **Downgrade works, and can lose**: going back from `TEXT` to `VARCHAR(100000)` is refused by PostgreSQL if a ballot is longer, and says so.
- Constraint names are PostgreSQL's own (`user_email_key`, …): the code reads them in an error (`users_router`), so do not add a naming convention without changing it.

## Where it runs

| where | how |
| --- | --- |
| development, testing | the application migrates itself when it starts (`AUTO_MIGRATE` empty = yes outside production) |
| `docker-compose.yml` | the `migrate` service runs once, `svs` waits for it (`service_completed_successfully`) |
| Kubernetes | an init container (the three replicas start together: Alembic takes a PostgreSQL advisory lock, one migrates, the others find nothing to do) |
| production | the application does **not** migrate: it checks it is at the latest revision and refuses to start otherwise (`AUTO_MIGRATE=true` to choose otherwise on a single instance) |

## A database made before there were migrations

`python -m app.db.migrate` recognises tables without a history (made by `create_all`), looks at `bulletin.content` (`VARCHAR` = the first version, `TEXT` = this one), stamps the matching revision and upgrades: nothing is recreated and nothing in it changes but what the migrations say. Databases older than the version that had `vote.encrypted_private_key` are not recognised: migrate their data by hand.

Before doing it to a real database: back it up, and read `make migrate-sql from=0001`.
