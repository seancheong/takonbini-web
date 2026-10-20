# API timing after AWS session refresh — 20 October 2026

The maintainer refreshed the AWS CLI session and reported **“logged in.”** Read-only Lambda configuration and CloudWatch log inspection then succeeded. This supersedes the expired-session blocker in the earlier [streaming evidence](./catalog-streaming-2026-10-20.md). No function configuration, code, alias, gateway, scheduler or data was changed by these reads.

## Observed backend contribution

The API uses Node.js 22 on arm64 with 256 MiB and a 10-second timeout. CloudWatch's first API invocation during the failed streaming series reports **537.51 ms Init Duration + 1,534.40 ms Duration**, with **2,072 ms Billed Duration** and 127 MiB peak memory. The first browser capture starts at 11:22:49.965 UTC; this catalog invocation runs from 11:22:51.934 to 11:22:53.469 UTC. The browser receives its late product markup around that end time. The subsequent eight invocation routes/times match the sequential catalog/detail browser series, with no other reports in that series' narrow window. This is strong timestamp/order correlation, not an end-to-end distributed trace.

| Browser sample | API handler duration (ms) | Init duration (ms) |
| --- | ---: | ---: |
| Catalog 1 | 1,534.40 | 537.51 |
| Heavy detail 1 | 454.80 | not reported |
| Light detail 1 | 284.44 | not reported |
| Catalog 2 | 189.98 | not reported |
| Heavy detail 2 | 74.84 | not reported |
| Light detail 2 | 57.34 | not reported |
| Catalog 3 | 142.81 | not reported |
| Heavy detail 3 | 210.24 | not reported |
| Light detail 3 | 166.63 | not reported |

[Sanitized configuration and all nine records](./api-cold-start-2026-10-20/correlated-series.json). Request/account/log-stream identifiers, keys, database configuration and payloads are omitted. “Not reported” does not prove every connection/cache/native/runtime subsystem was warm.

This materially changes the interpretation of the 4.258-second browser failure: a cold API invocation contributed about 2.07 seconds before its result could be streamed. The worse sample does not isolate a regression caused by streaming alone. The experiment remains reverted because it failed the release gate and the raw-HTML heading compatibility check; no speculative reintroduction follows.

## More than one limiting condition

[Historical narrow windows](./api-cold-start-2026-10-20/historical-windows.json) retain all reports around earlier first-catalog captures. The initial adopted-method 2.772-second failure occurs amid warm API traffic (reported durations about 22–82 ms, several overlapping public reads, so no unique invocation attribution). The lazy-image 3.409-second failure has a 720.63 ms API handler report in its window; the native-image 3.201-second failure has a 660.47 ms report near product delivery, plus another later report in the wider window. Neither reports Init Duration there.

Thus API cold start is a material observed contributor, not a complete explanation for every failed sample. Faster API startup alone is not evidence that the web/image gate passes. Keep the original browser failures, delivery limits and #86 gate open.

## Prepared next experiment; approval pending

AWS documents that Lambda CPU allocation scales with memory, so a measured memory comparison can test whether the 256 MiB configuration is limiting startup/handler speed ([official cold-start guidance](https://aws.amazon.com/blogs/compute/understanding-and-remediating-cold-starts-an-aws-lambda-perspective/)). Peak memory below 256 MiB does not rule out a CPU allocation limit. It also does not prove that raising memory helps or lowers the actual bill.

A local benchmark harness has a read-only default and a separately gated execution mode. [Concrete plan](./api-cold-start-2026-10-20/benchmark-plan.json): one temporary Tokyo arm64 function using the released ZIP (digest verified), existing API role and configuration; no new IAM policy, gateway, URL, schedule or provisioned concurrency. Nine configuration-reset trials alternate 256/512/1,024 MiB with an immediate repeat each, totaling **18 GET catalog reads**, 10-second timeout and reserved concurrency one. It records observed Init Duration, handler/billed time, GB-seconds and response digest equality, stopping on validation failures. Cleanup is restricted to its generated scratch function/log group and reports failures rather than claiming success. Database/source state remains shared and uncontrolled.

The real read-only plan passes against the active configuration. Account concurrency admission currently has 1,000 unreserved executions. Five mocked tests pass for the read-only default, configuration drift, source/target protection, bounded 18-call execution and cleanup after success/failure. These are harness checks, **not hosted memory-performance evidence**. No scratch resource was created. The maintainer was asked for explicit approval because execution goes beyond log inspection and creates a new resource with the API's existing access. Existing merge approvals do not authorize merging PR #88.

## Current status

PR #88 remains draft and unmerged. Its app implementation is still the verified rollback/native-image baseline; this follow-up adds evidence only. Next obtain the isolated-benchmark decision, then run it if approved and use measured latency/resource results to justify any API change. Production remains #87 / 0b6d03d; API settings remain unchanged. #86 and #17/#26/#27/#29 stay open. Production verification and the existing cost/resources/INP/device/accessibility/global/observation gates remain. #24 still has one evidenced new-configuration scheduled success and the next nominal opportunity is 21 October 02:00 Malaysia time; #23's stable 30-day window has not started.
