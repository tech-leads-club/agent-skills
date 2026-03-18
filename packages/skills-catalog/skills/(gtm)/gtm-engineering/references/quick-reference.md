# Quick Reference & Questions to Ask

## Quick Reference

| Concept                        | Key Number or Rule                                                            |
| ------------------------------ | ----------------------------------------------------------------------------- |
| Instruction stack layers       | ICP scoring, Messaging framework, Personalization rules, Sequence logic       |
| Architecture principle         | Instruction stacks + persistent context + feedback loops beat any single tool |
| n8n sweet spot                 | Complex AI workflows, high volume, self-hosting, data sovereignty             |
| Make sweet spot                | Visual workflow design, moderate complexity, budget-conscious teams           |
| Zapier sweet spot              | Simple integrations, non-technical teams, fastest setup                       |
| Enterprise iPaaS               | Tray.io (mid-market), Workato (enterprise compliance)                         |
| Enrichment waterfall threshold | 0.85+ confidence to accept, 0.50+ to accept with flag, below 0.50 reject      |
| Hot lead SLA                   | Respond in under 1 hour (ideally under 5 minutes for inbound)                 |
| Warm lead SLA                  | Respond in under 4 hours                                                      |
| Scoring formula (fit)          | Firmographic 40% + Technographic 35% + Behavioral 25%                         |
| Scoring formula (intent)       | First-Party 40% + Third-Party 35% + Triggers 25%                              |
| Workflow success rate alert    | Alert if below 95%                                                            |
| Enrichment hit rate alert      | Alert if below 60%                                                            |
| Email bounce rate alert        | Alert if above 5%                                                             |
| LLM cost optimization          | Haiku for classification, Sonnet/Opus for writing                             |
| Enrichment caching TTL         | 30-90 days depending on data volatility                                       |
| Version control                | Export workflows as JSON to Git after every change                            |
| GTM Engineer job market        | 1,400+ active postings on LinkedIn as of mid-2025                             |
| Agent adoption                 | 57% of organizations deploy agents for multi-stage workflows in 2026          |

---

## Questions to Ask

1. What are the top 3 manual processes your revenue team repeats every week?
2. How many leads per month flow through your pipeline, and what is the current conversion rate at each stage?
3. What is your current enrichment setup, and what is the hit rate (percentage of leads successfully enriched)?
4. Who maintains your current automations, and how much of their time does it consume?
5. What breaks most often in your current automation stack?
6. Do you have a documented ICP scoring model, or is qualification based on rep judgment?
7. What is your average lead response time for inbound demo requests?
8. How do you currently track the cost per lead, per meeting, and per opportunity?
9. What compliance or data residency requirements constrain your tool choices?
10. Are there existing n8n, Make, or Zapier workflows running? How many, and what do they do?
11. What CRM are you on (Salesforce, HubSpot, other), and what tier/plan?
12. How do you handle enrichment data that becomes stale? Is there a re-enrichment cadence?
13. What is the monthly budget allocated to automation tooling (including enrichment, outreach, and platform fees)?
14. Does your team have engineers who can write Python or JavaScript, or do you need strictly no-code solutions?
15. What does your feedback loop look like today? When a deal closes, does that data flow back into your targeting and scoring?

---
