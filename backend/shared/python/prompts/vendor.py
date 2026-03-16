from .base import make_prompt

VENDOR_INSTRUCTIONS = """
## CONTRACT TYPE: VENDOR / SUPPLIER AGREEMENT

Generate a comprehensive Vendor/Supplier Agreement that includes:

1. **Recitals** — Background and purpose of the agreement
2. **Definitions** — Key terms used throughout
3. **Scope of Services / Goods** — Detailed description based on usage patterns
4. **Pricing & Payment Terms** — Rates, invoicing schedule, payment terms, late fees
5. **Delivery & Performance Standards** — Timelines, quality standards, acceptance criteria
6. **Intellectual Property** — Ownership of work product, licenses, IP warranties
7. **Confidentiality** — Protection of proprietary information
8. **Term & Termination** — Duration, renewal options, termination for cause/convenience
9. **Representations & Warranties** — Warranties by each party
10. **Indemnification** — Mutual indemnification obligations
11. **Limitation of Liability** — Liability caps and exclusions
12. **Dispute Resolution** — Negotiation, mediation, arbitration, jurisdiction
13. **General Provisions** — Force majeure, notices, amendments, entire agreement
14. **Signature Block** — Execution by authorized representatives

Tailor all pricing, volume, and performance terms specifically to the usage patterns provided.
"""

vendor_prompt = make_prompt(VENDOR_INSTRUCTIONS)
