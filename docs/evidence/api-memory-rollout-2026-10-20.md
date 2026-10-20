# API memory rollout and serving-route correction — 20 October 2026

The maintainer explicitly approved **“Merge API #93 and apply 1,024 MiB.”** The reviewed one-setting configuration change was merged; its post-merge infrastructure CI passes. Web PR #88 is not approved for merge and remains unmerged. This record separates the initial control-plane update from the corrected serving route and its measurements.

## Initial update did not reach the serving version

A revision-guarded update moved the unqualified function from 256 to 1,024 MiB and verified active/successful state with the code digest, role, environment, runtime, architecture, handler and 10-second timeout unchanged. No smoke requests preceded the browser series. However, the first actual API REPORT still showed **256 MiB**, 521.19 ms initialization and 1,626.63 ms handler duration. API Gateway was routed through an existing alias to a published version; changing the unqualified configuration did not change that serving version. The initial verification was insufficient to establish production rollout and was corrected during this task.

The nine-run series against web preview **bc37dc9 / deployment 7200183034** must therefore **not** be labeled a post-serving-1,024 MiB result. [All nine browser samples](./api-memory-rollout-2026-10-20/before-serving-correction-mobile.json), [first API timing](./api-memory-rollout-2026-10-20/before-serving-correction-api.json), [initial update with corrected scope](./api-memory-rollout-2026-10-20/initial-unqualified-update.json).

| Case | LCP runs (s) | Scores | Target-image cache |
| --- | --- | --- | --- |
| Catalog | **5.262**, 1.477, 1.440 | 68, 100, 100 | MISS/HIT/HIT |
| Heavy detail | 1.870, 1.459, 1.477 | 99, 100, 100 | HIT/HIT/HIT |
| Light detail | 1.273, 1.134, 1.148 | 100, 100, 100 | MISS/HIT/HIT |

All CLS/TBT are zero. The command returns exit 1. The first document's final headers arrive around 4.070 s despite a much earlier 103 header; image load then takes ~1.052 s and render ~38 ms. These remain failures and are not erased by correcting the route.

## Serving code and benchmark artifact differ

Inspection found that the serving artifact and unqualified artifact have different ZIP digests **and different unpacked code contents** (one entry each, 1,472,795 versus 1,474,344 bytes). [Sanitized comparison](./api-memory-rollout-2026-10-20/artifact-scope-comparison.json). The earlier isolated benchmark used the unqualified artifact; its 56% cold improvement is not a controlled measurement of the pinned serving artifact. Identical product responses alone did not prove artifact identity. This limits the earlier conclusion; it does not justify switching production to different application code without review.

## Corrected memory-only serving rollout

The rollout preserved both artifacts. It downloaded and digest-checked the current serving ZIP and original unqualified ZIP, snapshotted configuration, and checked that their other reviewed declared settings match. It staged the current serving code at the approved 1,024 MiB configuration, published a version, restored the original unqualified code, and verified restoration **before** revision-guarding the existing alias onto the new version. The API Gateway integration was not changed. The prior serving version remains available for rollback.

Final control-plane verification confirms serving memory **1,024 MiB**, exact original serving code digest and other reviewed configuration preserved, plus the original unqualified code restored at 1,024 MiB. No application data, role, environment, runtime declaration, handler, timeout, gateway route or authentication policy changed. [Sanitized serving verification](./api-memory-rollout-2026-10-20/serving-configuration-verification.json). Publication/alias metadata are not a substitute for observing the configuration on real requests.

The corrected serving route now needs a fresh browser series on a new unvisited preview, followed by API REPORT correlation and preview/production correctness checks. The previous preview's successful image URLs have already been warmed, so it will not be reused as a fresh MISS claim. No claim that #86 passes is made before this validation. The configured higher-memory resource tradeoff and actual bill/traffic-mix limits remain explicit.
