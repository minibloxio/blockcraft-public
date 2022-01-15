resource "aws_route53_zone" "blockcraft_online" {
  name = "blockcraft.online"
}

resource "aws_route53_record" "blockcraft_online_all" {
  zone_id = aws_route53_zone.blockcraft_online.zone_id
  name    = "*.blockcraft.online"
  type    = "A"
  ttl     = "300"
  records = [
    aws_globalaccelerator_accelerator.main.ip_sets[0].ip_addresses[0],
    aws_globalaccelerator_accelerator.main.ip_sets[0].ip_addresses[1]
  ]
}

resource "aws_route53_record" "blockcraft_online_root" {
  zone_id = aws_route53_zone.blockcraft_online.zone_id
  name    = "blockcraft.online"
  type    = "A"

  alias {
    evaluate_target_health = false
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id

  }
}
