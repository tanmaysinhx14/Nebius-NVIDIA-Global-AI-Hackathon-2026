# Hackathon tool feedback worksheet

**Status:** Unfilled draft. Complete this from direct use before submitting; do not infer results from the implementation or documentation.

The submission requires feedback on Nebius Token Factory, Nebius AI Cloud, and the NVIDIA tools, models, or technologies actually used. Keep one evidence-backed entry for each tool. The event's [builder guidance](https://nebiusglobalaihackathon.devpost.com/updates/46205-how-to-build-a-winning-project) asks what you used, what worked, what needs work, how onboarding felt from zero to first use, and whether you would build with the tool again.

## Nebius Token Factory

- **Date and account/model setup:** [record the date, account configuration, and model IDs actually used]
- **What I used it for in Tracekit:** [describe the observed development or runtime task]
- **Onboarding, from zero to first successful call:** [record steps, time only if measured, and any friction]
- **What worked well:** [specific observed behavior]
- **What needs work:** [specific limitation or failure; include steps to reproduce when possible]
- **Documentation or support that helped / was missing:** [name the page or interaction]
- **Would I build with it again? Why?** [honest conclusion based on this use]
- **Evidence to keep:** [request/result notes, error, model ID, date; never paste API keys]

## NVIDIA Nemotron

- **Model IDs and tiers actually used:** [Nano / Super / Ultra; exact IDs]
- **Role in Tracekit:** [describe which pipeline stage used each model]
- **What worked well:** [specific observed output or behavior]
- **What needs work:** [specific quality, latency, availability, or integration issue]
- **Would I use these models again? Why?** [honest conclusion based on this use]
- **Evidence to keep:** [example input, observed output summary, timing/token metadata if returned]

## Other tools or services

- **Nebius AI Cloud:** [mark “not used” unless the prototype actually ran on it; Token Factory calls alone do not establish AI Cloud use]
- **Tavily:** One basic search on 2026-10-30 returned one Stack Overflow result. The Researcher Free plan showed 1,000 monthly credits and pay-as-you-go off; afterward, the billing page showed 1/1,000 credits used. The billing page says basic search costs one credit and requests stop at the plan limit. Search relevance beyond the returned host, no-results behavior, and failures still need separate review; the free-plan usage log is locked.
- **Other NVIDIA technology:** [name it only if actually used and describe where]

## Final feedback-form draft

Complete this only after filling the evidence above:

> I used **[tool/model]** for **[specific task]**. **[Observed result that worked]**. **[Concrete limitation or friction]**. Onboarding took **[measured time or qualitative description]**. I **[would / would not]** use it again because **[reason grounded in this project]**.

Before submitting, remove unused tools, unresolved brackets, unsupported time/quality claims, and all secrets. Keep the feedback consistent with the [project description draft](DRAFT.md) and the [build log](../BUILD_LOG.md).
