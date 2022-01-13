terraform {
  cloud {
    organization = "blockcraft"

    workspaces {
      name = "prod"
    }
  }
}
