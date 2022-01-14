resource "aws_volume_attachment" "save_data_attachment" {
  device_name = "/dev/sdf"
  volume_id   = aws_ebs_volume.save_data.id
  instance_id = aws_instance.main.id
}

resource "aws_ebs_volume" "save_data" {
  availability_zone = local.availability_zone
  size              = 40
  tags              = merge(local.tags, { Name = "blockcraft_data" })
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn-ami-hvm-*-x86_64-gp2"]
  }
}
