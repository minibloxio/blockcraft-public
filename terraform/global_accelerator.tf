resource "aws_globalaccelerator_accelerator" "main" {
  name = "blockcraft-global-accelerator"
}


resource "aws_globalaccelerator_listener" "main" {
  accelerator_arn = aws_globalaccelerator_accelerator.main.id
  protocol        = "TCP"

  port_range {
    from_port = 1
    to_port   = 65535
  }
}


resource "aws_globalaccelerator_endpoint_group" "main" {
  listener_arn = aws_globalaccelerator_listener.main.id

  endpoint_configuration {
    client_ip_preservation_enabled = true
    endpoint_id                    = aws_instance.main.id
    weight                         = 100
  }
}
