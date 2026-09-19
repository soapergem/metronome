locals {
  # for_each keys must be known at plan time. Keying on the static domain list
  # (rather than on domain_validation_options, whose contents only exist after
  # apply) keeps the plan valid; only the record values stay unknown.
  certificate_domains = toset([var.domain_name])

  # The module exposes domain_validation_options through a count splat, so it
  # arrives as a list holding one set.
  domain_validation_options = flatten(module.acm.domain_validation_options)
}

module "acm" {
  source  = "cloudposse/acm-request-certificate/aws"
  version = "0.18.1"

  providers = {
    aws = aws.us_east_1
  }

  domain_name       = var.domain_name
  validation_method = "DNS"

  # This zone is on Cloudflare, so the module must not try to write Route 53
  # records. Turning this off also skips the module's internal
  # aws_acm_certificate_validation, which is recreated below against the
  # Cloudflare record instead.
  process_domain_validation_options = false

  namespace = var.namespace
  stage     = var.stage
  name      = var.name
  tags      = var.tags
}

resource "cloudflare_dns_record" "acm_validation" {
  for_each = local.certificate_domains

  zone_id = data.cloudflare_zone.this.zone_id
  name = trimsuffix(one([
    for option in local.domain_validation_options :
    option.resource_record_name if option.domain_name == each.value
  ]), ".")
  type = one([
    for option in local.domain_validation_options :
    option.resource_record_type if option.domain_name == each.value
  ])
  content = trimsuffix(one([
    for option in local.domain_validation_options :
    option.resource_record_value if option.domain_name == each.value
  ]), ".")
  ttl     = 60
  proxied = false
  comment = "ACM validation for ${each.value}"
}

resource "aws_acm_certificate_validation" "site" {
  provider = aws.us_east_1

  certificate_arn         = module.acm.arn
  validation_record_fqdns = [for record in cloudflare_dns_record.acm_validation : record.name]
}
