resource "aws_instance" "main" {
  ami               = "ami-0fb653ca2d3203ac1"
  instance_type     = "t3.xlarge"
  availability_zone = local.availability_zone

  root_block_device {
    volume_size = 30
  }

  key_name = aws_key_pair.qhyun.key_name

  tags = merge(local.tags, { Name = "blockcraft_main_server" })

  vpc_security_group_ids = [
    aws_security_group.ubuntu.id
  ]

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [user_data]
  }
}


resource "aws_key_pair" "qhyun" {
  key_name   = "qhyun"
  public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDq365qSqhb7vQGDJ4K/mevfKPv6IxUBJjOOF1rvgK6SngerQ1JmkBGiWVBOR8WqBIS7xVsj/XM5bksUJ+MfFKGnuGZoJRn25NmAnO0hwEQeITneh9yhPNYCsE82p7l2p+0kFQleYG/v/ojP0Ro9sBQ+fgwmnaMROhjp15kTueKiG7ILmuVOU/lodLePCmBqupsh/aYeoq//lO0mX/uTS6YwthB1Y/Z21MrcRi2K91JLuulWrGvQ2UogeRACftUgsHpuFLNCe006Hw8kABoVDzrWi1xy+SP7G3mte1eUNE6XLnVwh95q/49rp/ODq3rNJ7U1u1HLuNc0Z6751LM3+vP howard@calculon"
  tags       = merge(local.tags)
}
