resource "aws_cloudfront_distribution" "main" {
  enabled = true
  aliases = ["blockcraft.online"]

  default_cache_behavior {
    allowed_methods = [
      "GET",
      "HEAD",
    ]
    cached_methods = [
      "GET",
      "HEAD",
    ]
    compress                   = true
    default_ttl                = 0
    max_ttl                    = 0
    cache_policy_id            = data.aws_cloudfront_cache_policy.main.id
    origin_request_policy_id   = data.aws_cloudfront_origin_request_policy.main.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.main.id
    target_origin_id           = "gold.blockcraft.online"
    viewer_protocol_policy     = "allow-all"
  }

  origin {
    domain_name = "gold.blockcraft.online"
    origin_id   = "gold.blockcraft.online"

    custom_origin_config {
      http_port  = 80
      https_port = 443

      origin_keepalive_timeout = 30
      origin_read_timeout      = 30

      origin_protocol_policy = "https-only"
      origin_ssl_protocols = [
        "TLSv1",
        "TLSv1.1",
        "TLSv1.2",
      ]
    }
  }

  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.main.arn
    # minimum_protocol_version = "TLSv1.2_2021"
    ssl_support_method = "sni-only"
  }

  restrictions {
    geo_restriction {
      locations        = []
      restriction_type = "none"
    }
  }

  depends_on = [
    aws_acm_certificate_validation.main
  ]
}

data "aws_cloudfront_cache_policy" "main" {
  id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
}

data "aws_cloudfront_origin_request_policy" "main" {
  name = "Managed-CORS-CustomOrigin"
}

resource "aws_cloudfront_response_headers_policy" "main" {
  name = "SharedArrayBuffer-CORS-Policy"

  cors_config {
    access_control_allow_credentials = false
    access_control_max_age_sec       = 600
    origin_override                  = true

    access_control_allow_headers {
      items = ["*"]
    }

    access_control_allow_methods {
      items = ["ALL"]
    }

    access_control_allow_origins {
      items = ["*"]
    }
  }

  custom_headers_config {
    items {
      header   = "Cross-Origin-Embedder-Policy"
      override = false
      value    = "require-corp"
    }
    items {
      header   = "Cross-Origin-Opener-Policy"
      override = false
      value    = "same-origin"
    }
  }
}
