resource "aws_route53_zone" "blockcraft_ml" {
  name = "blockcraftonline.ml"
}

resource "aws_route53_record" "all" {
  zone_id = aws_route53_zone.blockcraft_ml.zone_id
  name    = "*.blockcraftonline.ml"
  type    = "A"
  ttl     = "300"
  records = [
    aws_globalaccelerator_accelerator.main.ip_sets[0].ip_addresses[0],
    aws_globalaccelerator_accelerator.main.ip_sets[0].ip_addresses[1]
  ]
}
