output "server_ip" {
  description = "Public IP of blockcraft server"
  value       = aws_eip.ubuntu.public_ip
}

output "global_accelerator_ip_1" {
  description = ""
  value       = aws_globalaccelerator_accelerator.main.ip_sets[0].ip_addresses[0]
}

output "global_accelerator_ip_2" {
  description = ""
  value       = aws_globalaccelerator_accelerator.main.ip_sets[0].ip_addresses[1]
}

