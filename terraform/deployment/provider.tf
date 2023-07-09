terraform {
  required_version = ">= 1.0.11"
  backend "s3" {
    
  }

  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = ">= 5.4.0"
    }

    random = {
      source = "hashicorp/random"
      version = ">= 3.5.1"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Application = var.service_name
      Terraform  = true
    }
  }
}

variable "aws_region" {
  type = string
}