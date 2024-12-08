aws ec2 create-key-pair --key-name emi_cdk_vpc_key --query 'KeyMaterial' --output text > emi_cdk_vpc_key.pem
chmod 400 my-key-pair.pem