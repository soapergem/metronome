data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_response_headers_policy" "security_headers" {
  name = "Managed-SecurityHeadersPolicy"
}

# Vite fingerprints everything under /assets, so those can cache for a year.
# index.html and json files keep their names across deploys, so they get a
# short TTL and a deploy-time invalidation instead.
resource "aws_cloudfront_cache_policy" "short_lived" {
  name        = "${var.namespace}-${var.stage}-${var.name}-short-lived"
  comment     = "Unfingerprinted files: index.html and JSON configs"
  min_ttl     = 0
  default_ttl = 300
  max_ttl     = 3600

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

module "cdn" {
  source  = "cloudposse/cloudfront-s3-cdn/aws"
  version = "2.1.1"

  namespace = var.namespace
  stage     = var.stage
  name      = var.name
  tags      = var.tags

  aliases                  = [var.domain_name]
  acm_certificate_arn      = aws_acm_certificate_validation.site.certificate_arn
  minimum_protocol_version = "TLSv1.2_2021"

  # The zone lives on Cloudflare, so the record is created in dns.tf instead of
  # by the module's Route 53 alias submodule.
  dns_alias_enabled = false

  # Origin access control is the current mechanism; the module still defaults to
  # the legacy origin access identity.
  origin_access_type                 = "origin_access_control"
  block_origin_public_access_enabled = true
  bucket_versioning                  = "Enabled"
  encryption_enabled                 = true

  cloudfront_access_logging_enabled = var.cloudfront_access_logging_enabled

  default_root_object = "index.html"
  price_class         = var.price_class
  compress            = true
  ipv6_enabled        = true
  allowed_methods     = ["GET", "HEAD", "OPTIONS"]
  cached_methods      = ["GET", "HEAD"]

  cache_policy_id            = data.aws_cloudfront_cache_policy.caching_optimized.id
  response_headers_policy_id = data.aws_cloudfront_response_headers_policy.security_headers.id

  # An empty target_origin_id makes the module fall back to the bucket origin.
  ordered_cache = [
    {
      target_origin_id           = ""
      path_pattern               = "/index.html"
      allowed_methods            = ["GET", "HEAD", "OPTIONS"]
      cached_methods             = ["GET", "HEAD"]
      compress                   = true
      viewer_protocol_policy     = "redirect-to-https"
      cache_policy_id            = aws_cloudfront_cache_policy.short_lived.id
      response_headers_policy_id = data.aws_cloudfront_response_headers_policy.security_headers.id
    },
    {
      target_origin_id           = ""
      path_pattern               = "*.json"
      allowed_methods            = ["GET", "HEAD", "OPTIONS"]
      cached_methods             = ["GET", "HEAD"]
      compress                   = true
      viewer_protocol_policy     = "redirect-to-https"
      cache_policy_id            = aws_cloudfront_cache_policy.short_lived.id
      response_headers_policy_id = data.aws_cloudfront_response_headers_policy.security_headers.id
    },
  ]
}
