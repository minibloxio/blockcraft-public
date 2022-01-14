  #!/bin/bash
  sudo apt update
  sudo apt upgrade -y
  sudo apt install -y docker.io docker-compose
  git clone https://github.com/victoryqwei/blockcraft.git
  sudo docker-compose --file ./blockcraft/docker/docker-compose.yml up -d
