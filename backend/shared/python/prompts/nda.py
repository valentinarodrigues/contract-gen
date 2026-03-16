from .base import make_prompt

NDA_INSTRUCTIONS = """
## CONTRACT TYPE: NON-DISCLOSURE AGREEMENT (NDA) / CONFIDENTIALITY AGREEMENT

Generate a comprehensive NDA / Confidentiality Agreement that includes:

1. **Recitals** — Context of the business relationship and purpose of disclosure
2. **Definitions** — "Confidential Information", "Disclosing Party", "Receiving Party", "Representatives"
3. **Scope of Confidential Information** — What is and is not covered:
   - Inclusions (technical data, business plans, pricing, trade secrets, etc.)
   - Exclusions (publicly available, independently developed, required by law)
4. **Obligations of Receiving Party** — Non-disclosure, non-use, safeguarding standards
5. **Permitted Disclosures** — Disclosures to Representatives, legal requirements
6. **Return or Destruction** — Handling of materials upon termination or request
7. **Mutual vs. One-Way** — Specify if mutual or one-directional
8. **No License** — No implied license to IP
9. **Injunctive Relief** — Right to seek injunctive relief for breach
10. **Term** — Duration of confidentiality obligations (during and post-relationship)
11. **Governing Law & Jurisdiction** — Dispute resolution and applicable law
12. **General Provisions** — Entire agreement, amendments, severability, no waiver
13. **Signature Block**

Tailor the scope of confidential information to align with the services and data patterns described.
"""

nda_prompt = make_prompt(NDA_INSTRUCTIONS)
