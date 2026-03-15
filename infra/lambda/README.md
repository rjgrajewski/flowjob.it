# Skill Normalization – Lambda

## Flow: Scraping → Normalization

Normalization is **triggered after scraping completes**, not at a fixed time:

1. A schedule (EventBridge / Fargate/EC2) runs the **scraper** (scout).
2. After a successful run, the scraper **invokes asynchronously** the Lambda `flowjob-normalize-skills`.
3. The Lambda runs the full normalization pipeline (extract → normalize → deduplicate → link).

This way normalization runs only on days when the scrape succeeded, and always on up-to-date data.

## Scraper Configuration

Set the following in the environment where the scraper runs (e.g. Fargate, EC2, cron):

- **`NORMALIZE_LAMBDA_NAME`** = `flowjob-normalize-skills`  
  or **`NORMALIZE_LAMBDA_ARN`** = full ARN of the function  
- **`AWS_REGION`** = e.g. `eu-central-1` (if different from default)

The scraper’s IAM role (e.g. Fargate task role) must have `lambda:InvokeFunction` permission for this function.  
When deploying, you can pass **`ScraperRoleArn`** – the template will add a resource-based policy allowing that role to invoke the Lambda.

## EventBridge Schedule (optional)

The **`ScheduleEnabled`** parameter (default `false`) enables a fallback schedule: daily at 2:00 UTC.  
Use it only as a fallback when the scraper does not invoke the Lambda (e.g. no integration yet).

## Deploy

**Required locally:** SAM CLI (`brew install aws-sam-cli`), AWS CLI, Docker (for building the layer with asyncpg).

### `.env` variables (for deploy)

| Variable | Required | Description |
|----------|----------|-------------|
| `AWS_ACCESS_KEY_ID` / `AWS_BEDROCK_ACCESS_KEY` | yes* | AWS access key (deploy). `AWS_ACCESS_KEY_ID` is used; if missing, fallback to `AWS_BEDROCK_ACCESS_KEY`. |
| `AWS_SECRET_ACCESS_KEY` / `AWS_BEDROCK_SECRET_ACCESS_KEY` | yes* | AWS secret key. Same fallback as above to `AWS_BEDROCK_SECRET_ACCESS_KEY`. |
| `AWS_REGION` | no (default: eu-central-1) | Region (Lambda, Bedrock) |
| `DATABASE_URL` or `AWS_DB_*` | yes (for Lambda) | For RDS connection: either a ready `DATABASE_URL`, or `AWS_DB_ENDPOINT`, `AWS_DB_NAME`, `AWS_DB_USERNAME`, `AWS_DB_PASSWORD` – the script will build the URL from these. |
| `SCRAPER_ROLE_ARN` | no | ARN of the Fargate scraper role – if provided, that role will get permission to invoke the Lambda |

From the repository root:

```bash
# .env must contain AWS credentials (required for deploy):
#   AWS_ACCESS_KEY_ID=...
#   AWS_SECRET_ACCESS_KEY=...
#   AWS_REGION=eu-central-1
#   DATABASE_URL=postgresql://user:pass@host:5432/db
#   SCRAPER_ROLE_ARN=arn:aws:iam::ACCOUNT:role/fargate-role-name  # optional
./infra/lambda/deploy.sh
```

On first deploy you can run `sam deploy --guided` from the `infra/lambda/` directory first to save the configuration (e.g. region, stack name). The `deploy.sh` script builds and deploys using parameters from `.env`.

After deploy, add to the Fargate task definition (scraper) the environment variables: `NORMALIZE_LAMBDA_NAME=flowjob-normalize-skills` and `AWS_REGION=eu-central-1` (if different). That task’s role must have `lambda:InvokeFunction` permission for `flowjob-normalize-skills` – when deploying, pass `SCRAPER_ROLE_ARN` and the template will add this permission.
