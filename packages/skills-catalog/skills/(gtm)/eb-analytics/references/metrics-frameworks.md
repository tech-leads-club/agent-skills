# Metrics Frameworks Reference

## AARRR Detailed Implementation

### Acquisition Metrics

| Metric | How to Measure | Good Benchmark |
|--------|---------------|---------------|
| Cost Per Acquisition (CPA) | Ad spend / signups from that channel | Varies by industry |
| Organic vs Paid ratio | Organic signups / total signups | >60% organic is healthy |
| Channel effectiveness | Signups per channel over time | Focus on top 2-3 channels |
| Signup conversion rate | Visitors who sign up / total visitors | 2-5% for SaaS |

### Activation Metrics

| Metric | How to Measure | Good Benchmark |
|--------|---------------|---------------|
| Onboarding completion rate | Users completing onboarding / total signups | >60% |
| Time to first value | Minutes from signup to core action | <5 min ideal |
| Setup friction points | Drop-off at each onboarding step | Identify biggest drop |

### Retention Metrics

| Metric | How to Measure | Good Benchmark |
|--------|---------------|---------------|
| Day 1 retention | Users active day after signup / signups | >40% |
| Week 1 retention | Users active week 1 / signups | >25% |
| Month 1 retention | Users active month 1 / signups | >15% |
| Retention plateau | Where the curve flattens | Should flatten, not hit 0 |

### Revenue Metrics

| Metric | How to Measure | Good Benchmark |
|--------|---------------|---------------|
| Trial-to-paid conversion | Paid users / trial users | >5% (self-serve), >25% (sales) |
| ARPU | Total revenue / total active users | Depends on pricing |
| Expansion revenue | Upgrades + add-ons revenue | >20% of new MRR |
| Net revenue retention | See formula in main skill | >100% is great, >120% is excellent |

## Cohort Analysis Guide

### How to Read a Cohort Table

```
         Week 0  Week 1  Week 2  Week 3  Week 4
Jan W1    100%    45%     32%     28%     25%
Jan W2    100%    42%     30%     26%     --
Jan W3    100%    48%     35%     --      --
Jan W4    100%    44%     --      --      --
```

What to look for:
- **Vertical comparison**: Is Week 1 retention improving over time? (Jan W3 > Jan W1 = good)
- **Horizontal decay**: Where does retention stabilize? (If it hits 0, you have no PMF)
- **Step changes**: Did a product change improve retention for newer cohorts?

### Building Cohort Tables

```sql
-- PostHog HogQL or standard SQL
SELECT
  date_trunc('week', first_event) as cohort_week,
  date_trunc('week', event_time) as activity_week,
  count(distinct user_id) as users
FROM (
  SELECT
    user_id,
    min(timestamp) OVER (PARTITION BY user_id) as first_event,
    timestamp as event_time
  FROM events
  WHERE event = 'core_action'
) sub
GROUP BY 1, 2
ORDER BY 1, 2
```

## A/B Testing Methodology

### When to A/B Test
- You have enough traffic (>1000 visitors/week per variant)
- The change is measurable (conversion rate, not "feels better")
- You're willing to wait for statistical significance

### When NOT to A/B Test
- <100 conversions/week (not enough data)
- Obvious fixes (broken button, missing CTA)
- Early stage (<1000 users total) — just ship and iterate

### Test Process
1. **Hypothesis**: "Changing [X] will improve [metric] because [reason]"
2. **Minimum sample size**: Use a calculator (minimum 200 conversions per variant)
3. **Duration**: Run for at least 2 full weeks (captures weekly patterns)
4. **Significance**: p-value < 0.05 (95% confidence)
5. **Decision**: Significant + meaningful effect size → implement winner

### Common Mistakes
- Stopping the test early because one variant is "winning"
- Testing too many variants at once
- Not accounting for seasonality (run full weeks)
- Ignoring effect size (statistically significant but 0.1% improvement isn't worth it)
