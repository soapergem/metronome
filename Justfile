set dotenv-load
set dotenv-filename := ".envrc"

CWD := justfile_directory()
TF := "terraform -chdir=" + justfile_directory() + "/terraform"

default:
    @just --list | grep -v "^    default$"

# initialize terraform providers and modules (safe to re-run)
init:
    @{{TF}} init

# format and validate the terraform configuration
check:
    @{{TF}} fmt -check -diff
    @{{TF}} validate

# show what terraform would change
plan:
    @{{TF}} plan

# create or update the infrastructure
apply:
    @{{TF}} apply

# build the web app into web/dist
build:
    @cd {{CWD}}/web && npm run build

# upload web/dist to the origin bucket
sync:
    #!/usr/bin/env bash
    set -euo pipefail
    bucket="$({{TF}} output -raw bucket_name)"
    # Fingerprinted assets are safe to cache forever.
    aws s3 sync {{CWD}}/web/dist "s3://$bucket" --delete \
        --exclude "*" --include "assets/*" \
        --cache-control "public, max-age=31536000, immutable"
    # Everything else keeps its filename across deploys, so cache it briefly.
    aws s3 sync {{CWD}}/web/dist "s3://$bucket" --delete \
        --exclude "assets/*" \
        --cache-control "public, max-age=300"

# clear the CloudFront cache for the files that keep stable names
invalidate:
    #!/usr/bin/env bash
    set -euo pipefail
    distribution="$({{TF}} output -raw cloudfront_distribution_id)"
    aws cloudfront create-invalidation \
        --distribution-id "$distribution" \
        --paths "/*" | jq

# build, upload, and clear the cache in one step
deploy: build sync invalidate
    @echo "Deployed to $({{TF}} output -raw site_url)"
