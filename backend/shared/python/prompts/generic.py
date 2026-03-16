from .base import make_prompt

GENERIC_INSTRUCTIONS = """
## CONTRACT TYPE: GENERAL BUSINESS AGREEMENT

Generate a comprehensive General Business Agreement appropriate for the described relationship.
Analyze the provided usage patterns and party information to determine the most suitable structure.

Include all relevant sections based on the nature of the relationship:

1. **Recitals** — Background and purpose
2. **Definitions** — All key terms
3. **Scope of Engagement** — What is being agreed to
4. **Obligations of Each Party** — Rights and duties
5. **Financial Terms** — Pricing, payment, invoicing (if applicable)
6. **Performance Standards** — Expectations and metrics (if applicable)
7. **Intellectual Property** — Ownership and licensing (if applicable)
8. **Confidentiality** — Protection of information
9. **Term & Termination** — Duration and exit provisions
10. **Representations & Warranties** — Key assurances
11. **Indemnification** — Mutual protection
12. **Limitation of Liability** — Caps and exclusions
13. **Dispute Resolution** — Process for resolving disagreements
14. **General Provisions** — Standard boilerplate
15. **Signature Block**

Use the custom instructions field to guide any specific requirements or omissions.
"""

generic_prompt = make_prompt(GENERIC_INSTRUCTIONS)
