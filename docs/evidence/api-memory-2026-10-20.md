# Approved isolated API memory benchmark — 20 October 2026

The maintainer explicitly chose **“Run isolated benchmark (Recommended)”** for the prepared single-scratch-function, 18-read comparison. That authorization covered this experiment and cleanup, not a production memory change, merge, new public endpoint or recurring work. The experiment completed all 18 calls. Production remains at **256 MiB**, with its original modification timestamp.

## Method and scope

The harness copied the existing released ZIP and verified its SHA-256 against the source Lambda configuration, reusing the existing role/environment in one temporary Tokyo function: Node.js 22, arm64, 10-second timeout, reserved concurrency one. No new IAM role/policy, function URL, API Gateway integration, schedule or provisioned concurrency was created. Each invocation was a read-only `GET /products?limit=20&status=allWithoutSoon`.

The predeclared memory order was **256 / 512 / 1,024 / 1,024 / 512 / 256 / 512 / 256 / 1,024 MiB**. A unique configuration value reset each trial's execution environment; every first invocation reports Init Duration, and every immediate repeat omits it. There are three observed cold calls and three immediate repeats per setting. All **18 return 200 with 20 products and identical response digests**. The shared database, secure-parameter service and network state were not reset or isolated. Three samples per condition support a candidate configuration, not statistical certainty or steady-state traffic modeling.

[Every sample](./api-memory-2026-10-20/samples.json), [summary](./api-memory-2026-10-20/summary.json), [executed harness](./api-memory-2026-10-20/benchmark.py) and [mocked safety tests](./api-memory-2026-10-20/test_benchmark.py). Lambda REPORT values drive the comparison. `clientWithCliMs` includes CLI/credential/network overhead and must not be called API response time. Resource/account/request identifiers, credentials, database settings and product payloads are omitted from committed results.

## Results

| Memory | Cold init + handler runs (s) | Cold median | Immediate-repeat handler runs (ms) | Median cold billed GB-s | Median repeat billed GB-s |
| --- | --- | ---: | --- | ---: | ---: |
| 256 MiB | 1.864 / 1.872 / 2.057 | **1.872 s** | 92.07 / 171.84 / 104.58 | **0.4680** | 0.02625 |
| 512 MiB | 1.463 / 1.167 / 1.155 | **1.167 s** | 100.20 / 217.21 / 201.48 | **0.5835** | 0.10100 |
| 1,024 MiB | 0.834 / 0.723 / 0.831 | **0.831 s** | 40.15 / 44.33 / 34.35 | **0.8310** | 0.04100 |

Relative to 256 MiB, 512 MiB reduces median cold time **37.7%** and increases median cold billed GB-seconds **24.7%**. At 1,024 MiB the corresponding changes are **55.6% faster** and **77.6% more billed GB-seconds**. Repeat medians are 104.58 / 201.48 / 40.15 ms; the 512 MiB repeats are noisier/slower, so do not invent a smooth scaling curve. At 1,024 MiB the repeat median uses 56.2% more GB-seconds than at 256 MiB despite lower duration.

The complete experiment reports **6.204 billed GB-seconds across 18 invocations**. These are compute-usage units, not an account bill or monthly estimate; request mix, cold frequency, pricing tiers/credits and other services were not measured. No savings or hobby-budget acceptance is asserted. The strongest consistent improvement is handler duration; exact SSM, Mongo connection/authentication, query and CPU contributions are not separately instrumented. Higher Lambda memory also provides more CPU ([AWS documentation](https://docs.aws.amazon.com/lambda/latest/dg/configuration-memory.html)), but this experiment does not identify each internal cause.

## Cleanup verified, including a late log group

The harness reported deleting its function and log group. Independent inspection confirmed the function absent but found the same owned log group after that cleanup. It was deleted again, then fresh reads confirmed **both absent**, source API still 256 MiB / 10 seconds with unchanged modification timestamp, and unreserved account concurrency restored to its prior value. No extra catalog invocations were used for cleanup. [Independent verification](./api-memory-2026-10-20/cleanup-verification.json).

This late log-group observation is retained rather than treating the initial cleanup return as conclusive. The archived harness is the measured version; any future run must independently verify absence after late log delivery and clean up only its own recorded scratch resource. Its default is read-only. Running with `--execute` requires authorization for the new resource and its existing API access. Five mocked safety tests pass, and the CLI invocation adapter was checked with AWS DryRun 204 without executing API code before the experiment.

## Candidate and remaining gates

A one-setting API configuration proposal for **1,024 MiB** is prepared for review because it gives the largest consistent cold reduction in these samples. Its format and Terraform validation checks pass; validation retains the existing unrelated MongoDB Atlas resource deprecation warning. No production plan/apply or memory update has run. The proposal is not an assertion that 1,024 MiB is cheaper or that the browser gate now passes. A reviewed rollout must preserve the released code digest, role, environment and 10-second timeout, change only memory, then measure the browser critical path before warming it with smoke requests. Any production change needs separate explicit approval.

PR #88 remains draft/unmerged, and #86 stays open: the retained native-route baseline first catalog is 3.201 seconds, and earlier failures also occurred with warmer APIs. API memory tuning is one contributor, not a demonstrated complete web fix. Production verification, actual resource/cost acceptance and existing INP/device/accessibility/global/observation gates remain. #24 retains one evidenced new-configuration scheduled success; next nominal opportunity is 21 October 02:00 Malaysia time. #23's stable 30-day window has not started.
