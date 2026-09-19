data "cloudflare_zone" "this" {
  filter = {
    name = var.cloudflare_zone_name
  }
}

resource "cloudflare_dns_record" "site" {
  zone_id = data.cloudflare_zone.this.zone_id
  name    = var.domain_name
  type    = "CNAME"
  content = module.cdn.cf_domain_name
  ttl     = 300
  proxied = var.cloudflare_proxied
  comment = "Metronome Webapp CloudFront distribution"
}
