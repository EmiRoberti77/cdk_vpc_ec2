import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as dotenv from "dotenv";
dotenv.config();

export class CdkDeployEc2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, process.env.VPC_NAME!, {
      cidr: process.env.CIDR,
      maxAzs: 1, // Only one AZ for simplicity
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: process.env.SUBNET!,
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const keyName = process.env.KEY_NAME!;

    // Security Group for EC2 with SSH access
    const securityGroup = new ec2.SecurityGroup(
      this,
      process.env.SECURITY_GROUP!,
      {
        vpc,
        allowAllOutbound: true, // Allow outbound traffic
        description: "Allow SSH access",
      }
    );
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allow SSH access"
    );

    // IAM Role for EC2
    const role = new iam.Role(this, process.env.EC2_INSTANCE_ROLE!, {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    // Add permissions to the role (optional, for SSM or other services)
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );

    // Launch an EC2 instance
    const instance = new ec2.Instance(this, process.env.EC2_INSTANCE!, {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux(), // Amazon Linux 2 AMI
      securityGroup,
      keyName, // Specify the key pair
      role,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    new cdk.CfnOutput(this, "InstancePublicIP", {
      value: instance.instancePublicIp,
      description: "Public IP of the EC2 instance",
    });
  }
}
