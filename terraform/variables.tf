variable "domain_name" {
  description = "Fully qualified domain the site is served from."
  type        = string
  default     = "metronome.gemovationlabs.com"
}

variable "cloudflare_zone_name" {
  description = "Cloudflare zone that contains domain_name."
  type        = string
  default     = "gemovationlabs.com"
}

variable "aws_region" {
  description = "Region for the S3 bucket. CloudFront and ACM are global/us-east-1 regardless."
  type        = string
  default     = "us-east-1"
}

# The Cloud Posse modules derive resource names from these via cloudposse/label.
# The origin bucket lands at "<namespace>-<stage>-<name>-origin".
variable "namespace" {
  description = "Namespace segment of generated resource names."
  type        = string
  default     = "gemlabs"
}

variable "stage" {
  description = "Stage segment of generated resource names."
  type        = string
  default     = "prod"
}

variable "name" {
  description = "Name segment of generated resource names."
  type        = string
  default     = "metronome"
}

variable "price_class" {
  description = "CloudFront price class. PriceClass_100 is US/Canada/Europe only and is the cheapest."
  type        = string
  default     = "PriceClass_100"

  validation {
    condition     = contains(["PriceClass_All", "PriceClass_200", "PriceClass_100"], var.price_class)
    error_message = "price_class must be PriceClass_All, PriceClass_200, or PriceClass_100."
  }
}

variable "cloudfront_access_logging_enabled" {
  description = "Whether CloudFront writes access logs. The module provisions a dedicated log bucket when this is on; off by default to keep this stack small."
  type        = bool
  default     = false
}

variable "cloudflare_proxied" {
  description = "Whether Cloudflare proxies the record. Keep this false: CloudFront terminates TLS with the ACM certificate, and proxying would put a second CDN in front of it."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags applied to every taggable resource."
  type        = map(string)
  default = {
    Project = "metronome"
  }
}
