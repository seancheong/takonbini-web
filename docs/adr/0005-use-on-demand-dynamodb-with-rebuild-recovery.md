# Use on-demand DynamoDB with rebuild recovery

Takonbini will run its three index-free Tokyo DynamoDB tables in Standard
on-demand mode and enforce a conservative pre-free-tier monthly request and
storage envelope in the refresh runner. Paid PITR, managed backups,
customer-managed KMS keys, and operational CloudWatch alarms are deliberately
omitted: immutable current and predecessor generations handle ordinary
rollback, deletion protection and least privilege prevent table removal, and a
catastrophic loss is recovered only by producing a fresh validated three-store
generation. This trades a guaranteed disaster-recovery time for a credible
sub-RM1 hobby-project operating cost without weakening publication correctness.

## Consequences

Every refresh and cleanup must pass cost admission before it writes, and
production cutover requires a measured empty-table rebuild drill. Whole-table
or account loss has no promised RTO or RPO; direct reads remain available during
ordinary refresh failures, but destructive loss may make the catalog
unavailable until a fresh generation is validated.
