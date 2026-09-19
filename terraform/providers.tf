provider "aws" {
  region = var.aws_region
}

# CloudFront only accepts certificates issued in us-east-1, regardless of where
# the bucket lives.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# Reads CLOUDFLARE_API_TOKEN from the environment so the token never lands in
# state, a tfvars file, or version control.
provider "cloudflare" {}
