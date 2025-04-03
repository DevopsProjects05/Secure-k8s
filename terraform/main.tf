provider "vault" {
}

data "vault_generic_secret" "aws_credentials" {
  path = "aws/creds/dev-role"
}

provider "aws" {
  region     = "ap-south-1"
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

resource "aws_eks_cluster" "ecommers_app" {
  name     = "Ecommers-app"
  role_arn = ""  # Leave blank for cluster service role

  vpc_config {
    subnet_ids = data.aws_subnets.default.ids
    endpoint_public_access = true
  }

  version = "1.31"

  kubernetes_network_config {
    elastic_load_balancing {
      enabled = true
    }
  }

  
}

resource "aws_eks_node_group" "ecommerse_workers" {
  cluster_name  = aws_eks_cluster.ecommers_app.name
  node_role_arn = ""  # Leave blank for node IAM role
  subnet_ids    = data.aws_subnets.default.ids

  scaling_config {
    desired_size = 2
    max_size     = 3
    min_size     = 1
  }
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}
