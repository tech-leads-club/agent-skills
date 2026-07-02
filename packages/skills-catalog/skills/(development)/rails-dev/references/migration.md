# Migrations

Migrations are small and reversible. The existing schema is the source of truth: match the conventions already in `db/schema.rb` rather than importing habits from elsewhere. Read before writing one.

---

## Primary keys: UUID or ULID

Both UUID and ULID are 128-bit, non-sequential, collision-safe, and client-generatable, which is why teams pick them over auto-increment integers (no enumeration, no cross-database coordination, safe in public URLs). They differ in one axis:

- **UUID (v4)** is fully random. Maximum unpredictability, but rows insert in random index positions, which fragments the primary-key B-tree on write-heavy tables.
- **ULID** is lexicographically sortable: a millisecond timestamp prefix plus randomness. Inserts stay roughly append-ordered (better index locality) and the id sorts by creation time, at the cost of leaking creation time and a sliver of predictability.

**Follow the project's standard, don't introduce a second one.** Check `db/schema.rb` and `config/application.rb` for the established `primary_key_type`. When the project standardizes on **ULID** (e.g. `config.generators { |g| g.orm :active_record, primary_key_type: :ulid }` plus an initializer that defaults it), hand-written migrations declare it explicitly:

```ruby
create_table :certificates, id: :ulid do |t|
  # ...
end
```

---

## References: integrity vs flexibility

A reference can be a hard foreign key or a soft reference. This is a genuine trade-off, not a default:

- **Foreign key** (`foreign_key: true`): the database guarantees referential integrity. Nothing orphans a row, not even a write outside the app. The cost is rigidity: data migrations, deletes, and backups must respect constraint order, and cascades can surprise you.
- **Soft reference** (indexed `*_id`, no constraint): integrity becomes the model's job (`belongs_to`, `dependent: :destroy`, validations). You gain operational flexibility and accept that a write outside the model layer can orphan rows. This buys flexibility, not decoupling: the column and the association still couple the two tables.

**Surface this trade-off and follow the project's stance. If the stance isn't set, ask the user whether they want integrity or flexibility.** This project chose **flexibility**: prefer soft references, no FK constraint.

```ruby
t.references :user, null: false, index: true   # soft reference, no foreign_key: true
```

If the schema still carries FK constraints from earlier migrations, treat those as legacy to migrate, not the pattern to copy.

---

## Tenant scoping column (multi-tenant only)

A multi-tenant app gives every tenant-scoped table a `tenant_id` / `account_id` and indexes it: that column is what isolates and scopes one tenant's data and keeps tenant queries fast. See `multi-tenant.md` for the full pattern.

This is **conditional, not universal**. This codebase is single-tenant, so its tables carry no `account_id` and queries scope by `Current.user` / membership instead. Add a scoping column only when the app is actually multi-tenant.

---

## Creating a table

```ruby
class CreateCertificates < ActiveRecord::Migration[8.0]
  def change
    create_table :certificates, id: :ulid do |t|
      t.references :user, null: false, index: true
      t.references :template, null: false, index: true   # soft reference, no FK

      t.string :title, null: false
      t.string :status, default: "pending", null: false
      t.datetime :issued_at

      t.timestamps
    end

    add_index :certificates, [:user_id, :status]
  end
end
```

`null: false` for required associations, required attributes, and any column with a default. Composite indexes follow real query patterns; order matters (`[:a, :b]` serves `WHERE a` and `WHERE a AND b`, not `WHERE b` alone).

A partial index (PostgreSQL `where:`) keeps an index small when you only ever query a subset, e.g. a uniqueness rule that applies to live rows only:

```ruby
add_index :certificates, :user_id, unique: true, where: "revoked_at IS NULL"
```

---

## Changing an existing table

Adds are safe. Removals, type changes, and new `NOT NULL` constraints need care on a live table: split them so deploy order never breaks running code.

```ruby
# Add a column
add_column :certificates, :revoked_at, :datetime

# Two-step backfill before a NOT NULL / default
class BackfillCertificateStatus < ActiveRecord::Migration[8.0]
  def up
    Certificate.in_batches.update_all(status: "issued")   # batched, no long lock
    change_column_default :certificates, :status, "issued"
  end

  def down = change_column_default :certificates, :status, nil
end

# Remove a column only after deploying code that no longer reads it
remove_column :certificates, :legacy_flag, :boolean
```

Avoid boolean columns for business state (`closed`, `published`): model those as records (see `state-records.md`). Booleans are for technical flags only.

---

## Reversibility

`change` auto-reverses for create/add/rename. For data changes, write `up`/`down`; raise `ActiveRecord::IrreversibleMigration` in `down` when a reverse would lose data.

```ruby
def up
  Member.where(status: nil).update_all(status: "active")
end

def down = raise ActiveRecord::IrreversibleMigration
```

---

## Branch workflow

Several migrations in one branch are fine when they touch different tables. What to avoid is a chain that amends the same table repeatedly in the same branch: add the table, then change it, then change it again. If a table is introduced in this branch, put its whole shape in the single migration that creates it. To iterate, edit that migration and reset rather than stacking corrective migrations on top:

```bash
bin/rails db:migrate:reset
RAILS_ENV=test bin/rails db:migrate:reset
```

Never hand-edit `db/schema.rb`; let migrations regenerate it. If `db/queue_schema.rb`, `db/cache_schema.rb`, or `db/cable_schema.rb` shows up modified after a reset, stop and flag it: that change is almost always accidental.

---

## Checklist

- Primary key matches the project standard (ULID here); don't mix in UUIDs
- References are soft (indexed `*_id`, no FK constraint) per the project's flexibility choice; surface the trade-off if the stance is ever in question
- Tenant/account scoping column only on multi-tenant apps; this codebase has none
- `null: false` on required columns and columns with defaults
- Business state is a record, not a boolean column
- Removals/type-changes/NOT-NULL are split across deploys; backfills run in batches
- Migration is reversible, or `down` raises `IrreversibleMigration` deliberately
- A table introduced in a branch gets its full shape in one migration; iterate with `db:migrate:reset`, never stack corrective migrations or hand-edit schema files
