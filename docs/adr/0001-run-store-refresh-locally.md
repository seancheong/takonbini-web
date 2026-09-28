---
status: accepted
---

# Run Store Refresh on the owner's Mac

Takonbini will run its weekly three-store Store Refresh on the owner's Mac. The
runner executes stores sequentially, retains the resumable workflow and
publication safety boundaries, and may use a guarded macOS schedule only after
a complete manual shadow run succeeds. Hosted Chromium execution was rejected
for the current unfunded personal project because Cloud Run did not complete a
representative run and the optimized Apify fallback projected about USD 4.50
per month before OpenAI and database costs.

## Considered options

- **Google Cloud Run Jobs:** rejected after the three-store shadow attempts
  failed or timed out and retained image storage exceeded the strict gate at
  the measured snapshot.
- **Apify:** rejected after bounded Lawson trials showed that the optimized
  workload still projected above the accepted monthly fallback budget.
- **Local execution:** accepted because the owner already has the machine,
  weekly operation does not require always-on compute, and the existing
  manifests, chunks, leases, candidate generations, and translation cache make
  interrupted work resumable.

## Consequences

- The Mac must be awake and connected during a refresh.
- A missed local schedule requires an operator to resume or rerun it.
- Before scheduling, the owner will set workstation impact limits for the run
  window, power state, CPU and memory use, network use, and interruption
  behavior so refreshes do not interfere with normal MacBook work.
- Publication and scheduling stay disabled until the manual three-store shadow
  gate and recovery checks pass.
- Cloud Run and Apify artifacts remain historical evidence. No more hosted
  scraper runs are planned under the current constraints.
- Hosted execution can be reconsidered if the project gains funding or needs an
  unattended service-level objective that a personal machine cannot provide.
