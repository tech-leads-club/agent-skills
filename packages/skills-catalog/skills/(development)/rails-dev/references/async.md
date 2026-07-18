# Async

For concurrent I/O this codebase reaches for fibers (the `async` gem), not threads. Fibers are lightweight and cooperatively scheduled: you fan out blocking I/O (HTTP fetches, downloads) without sizing a thread pool or the shared-mutable-state hazards of real threads. Use them for external I/O only. Read before adding concurrency.

---

## Fibers over threads

Wrap the concurrent I/O in a `Sync` block, one `Async` per unit of work, and wait for them. Fibers suit I/O-bound fan-out; they don't make CPU-bound work faster.

```ruby
results = []
Sync do
  feeds.map do |feed|
    Async { results << [feed, fetch(feed.url)] }
  end.each(&:wait)
end
```

---

## Never touch the database inside a fiber

ActiveRecord's connection pool is thread-keyed, not fiber-keyed: every fiber in one thread shares a single connection. Concurrent SQL from multiple fibers corrupts results, one fiber reads another's response, or gets `nil`. Keep database work out of the fibers entirely: fetch in the fibers, collect the results, then do the writes sequentially after the `Sync` block exits.

```ruby
# Don't: a DB write inside the fiber shares one connection
Sync do
  feeds.map { |feed| Async { feed.save_entries(fetch(feed.url)) } }.each(&:wait)
end

# Do: fibers fetch, the database work runs sequentially afterward
fetched = []
Sync do
  feeds.map { |feed| Async { fetched << [feed, fetch(feed.url)] } }.each(&:wait)
end
fetched.each { |feed, parsed| feed.save_entries(parsed) }
```

---

## Checklist

- Fibers (`async`) for concurrent external I/O; not threads, and not for CPU-bound work
- No query or write inside an `Async` fiber; collect results, persist sequentially after `Sync`
- Concurrency is for I/O fan-out, not for parallelizing database access
