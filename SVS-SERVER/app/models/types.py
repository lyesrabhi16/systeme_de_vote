from datetime import UTC, datetime

from sqlalchemy.types import DateTime, TypeDecorator


def utcnow() -> datetime:
    """The current time, with its timezone (UTC). Everything about time in this project uses this."""
    return datetime.now(UTC)


class UTCDateTime(TypeDecorator):
    """
    A date and time that is always UTC in Python and is stored as a plain UTC timestamp (the same column as before: no migration).

    What goes in is converted to UTC if it carries a timezone (a request saying "+02:00" is not read as UTC), and is read as UTC if it
    does not (that is how the column was always filled). What comes out carries UTC, so the API sends "...Z" and a browser shows the
    time in the voter's own timezone, and it can be compared with `utcnow()`.
    """

    impl = DateTime(timezone=False)
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            return value
        return value.astimezone(UTC).replace(tzinfo=None)

    def process_result_value(self, value: datetime | None, dialect) -> datetime | None:
        return None if value is None else value.replace(tzinfo=UTC)
