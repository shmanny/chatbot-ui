data "aws_caller_identity" "current" {
}

# data "aws_vpc" "main" {
#   tags = {
#     Name = "${var.app_name}-vpc"
#   }
# }

# data "aws_subnets" "public" {
#   # vpc_id = data.aws_vpc.main.id
#   tags = {
# 	Type = "public"
#   }
# }

# data "aws_subnets" "private" {
#   # vpc_id = data.aws_vpc.main.id
#   tags = {
# 	Type = "private"
#   }
# }

variable "app_name" {
  type = string
}