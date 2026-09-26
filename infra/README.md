# Infrastructure

This directory intentionally contains no active cloud provisioning. The first production-ready change should add reviewed Terraform modules for environment-separated Cloud Run, Cloud SQL, Cloud Storage, BigQuery, Artifact Registry, IAM, and Secret Manager resources. CI should authenticate with workload identity federation—never a stored service-account key.

