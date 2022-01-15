terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "3.71.0"

    }
  }
}

locals {
  region            = "us-east-2"
  availability_zone = "${local.region}a"
  tags = {
    Service     = "blockcraft"
    Environment = "prod"
  }
}

provider "aws" {
  region     = local.region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

# provider used for CloudFront keys which supports US East (N. Virginia) Region only.
provider "aws" {
  alias      = "us_east_1"
  region     = "us-east-1"
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}
