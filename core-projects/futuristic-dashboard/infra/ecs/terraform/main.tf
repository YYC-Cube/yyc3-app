terraform {
  required_providers {
    alicloud = {
      source  = "aliyun/alicloud"
      version = "~> 1.213"
    }
  }
}

provider "alicloud" {
  region = var.region
}

variable "domain" { type = string }
variable "ip"     { type = string }
variable "ttl"    { type = number }
variable "records" {
  type = list(object({
    id        = string
    subdomain = string
  }))
}

resource "alicloud_dns_record" "records" {
  for_each   = { for r in var.records : r.id => r }
  name       = each.value.subdomain == "@" ? var.domain : "${each.value.subdomain}.${var.domain}"
  type       = "A"
  value      = var.ip
  ttl        = var.ttl
  priority   = 1
}
