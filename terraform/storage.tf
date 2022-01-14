resource "aws_volume_attachment" "save_data_attachment" {
  device_name = "/dev/sdf"
  volume_id   = aws_ebs_volume.save_data.id
  instance_id = aws_instance.main.id
}

resource "aws_ebs_volume" "save_data" {
  availability_zone = local.availability_zone
  size              = 40
  tags              = merge(local.tags, { Name = "blockcraft_data" })

  lifecycle {
    prevent_destroy = true
  }
}
