resource "aws_route53_record" "certificate_validation_record" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  ttl     = 300
  name    = each.value.name
  records = [each.value.record]
  type    = each.value.type
  zone_id = aws_route53_zone.blockcraft_online.zone_id
}

resource "aws_acm_certificate_validation" "main" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.certificate_validation_record : record.fqdn]
}

resource "aws_acm_certificate" "main" {
  domain_name       = "blockcraft.online"
  validation_method = "DNS"
  tags              = local.tags
  provider          = aws.us_east_1
}
