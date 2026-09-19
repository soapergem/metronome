output "site_url" {
  description = "Public URL for the site."
  value       = "https://${var.domain_name}"
}

output "bucket_name" {
  description = "Origin bucket. Deploy with: aws s3 sync web/dist s3://<bucket> --delete"
  value       = module.cdn.s3_bucket
}

output "cloudfront_distribution_id" {
  description = "Distribution to invalidate after a deploy."
  value       = module.cdn.cf_id
}

output "cloudfront_domain_name" {
  description = "CloudFront hostname the DNS record points at."
  value       = module.cdn.cf_domain_name
}

output "acm_certificate_arn" {
  description = "Validated certificate serving the site."
  value       = aws_acm_certificate_validation.site.certificate_arn
}
