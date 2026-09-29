---
title: 'The interesting work is in the in-between.'
description: 'On integrations, the edges of systems, and asking better questions before writing code.'
date: 2026-09-29
category: Coding
readTime: 3 min
sample: true
---

A system can work perfectly on its own and still be difficult to work with. The awkward parts tend to appear at the boundaries: where an order becomes an invoice, where a customer record moves between platforms, or where an error needs to become something a person can act on.

That makes integration work as much an exercise in understanding as it is in implementation.

## Start with the journey

Before thinking about an endpoint, follow one piece of information through the whole process. Where does it begin? Who needs it next? What changes along the way?

A simple diagram often reveals questions that a long requirements document misses:

- Which system owns the original record?
- What happens when two systems disagree?
- Can the same event arrive more than once?
- How will someone know that a step failed?

The answers help define the actual contract between systems.

## Make failure understandable

A useful integration needs a plan for the ordinary things that go wrong: a slow response, an expired credential, an incomplete record, or a service that is temporarily unavailable.

Retries are one part of that plan. Clear logs, safe handling of duplicate events, and a visible path to recovery matter just as much. The goal is to leave enough context that the next person can understand what happened.

## Keep the human in the loop

The final handoff is often to a person. Someone needs to investigate an exception, check a result, or explain the process to a colleague.

Documentation and support tools are part of the product. A small, well-explained system can be more useful than a sophisticated one that nobody knows how to operate.

The interesting work lives between the systems, and between the people using them.
