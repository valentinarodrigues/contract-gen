from .base import make_prompt

SLA_INSTRUCTIONS = """
## CONTRACT TYPE: SERVICE LEVEL AGREEMENT (SLA) / CONSUMER CONTRACT

Generate a comprehensive Service Level Agreement that includes:

1. **Recitals** — Background and purpose
2. **Definitions** — Key terms (Uptime, Incident, Response Time, etc.)
3. **Service Description** — Detailed description of services provided
4. **Service Levels & Metrics** — Specific KPIs based on usage patterns:
   - Availability/Uptime percentage (e.g., 99.9%)
   - Response time targets
   - Throughput and capacity commitments
   - Error rate thresholds
5. **Measurement & Reporting** — How metrics are measured, reporting frequency
6. **Credits & Remedies** — Service credits for SLA breaches, credit calculation formula
7. **Exclusions** — What is excluded from SLA calculations (maintenance windows, force majeure)
8. **Support & Incident Management** — Severity levels, response times, escalation paths
9. **Change Management** — Process for service modifications
10. **Customer Responsibilities** — Obligations of the service consumer
11. **Term & Termination** — Duration, renewal, termination rights
12. **Confidentiality** — Data and service information protection
13. **Limitation of Liability** — Caps on liability, exclusion of consequential damages
14. **General Provisions** — Notices, amendments, governing law
15. **Signature Block**

Incorporate specific SLA requirements and thresholds from the usage patterns provided.
Ensure all numeric SLA targets are explicitly stated.
"""

sla_prompt = make_prompt(SLA_INSTRUCTIONS)
