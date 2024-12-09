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
      maxAzs: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: process.env.SUBNET!,
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const keyName = process.env.KEY_NAME!;

    const securityGroup = new ec2.SecurityGroup(
      this,
      process.env.SECURITY_GROUP!,
      {
        vpc,
        allowAllOutbound: true,
        description: "HTTP, HTTPS, SSH, and application ports access",
      }
    );

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allow SSH access"
    );
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow HTTP access"
    );
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "Allow HTTPS access"
    );
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8000),
      "custom port for node service"
    );
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8080),
      "custom port for node servive"
    );

    const role = new iam.Role(this, process.env.EC2_INSTANCE_ROLE!, {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );

    const instance = new ec2.Instance(this, process.env.EC2_INSTANCE!, {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux(),
      securityGroup,
      keyName,
      role,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    const elasticIp = new ec2.CfnEIP(this, "ElasticIp", {
      instanceId: instance.instanceId,
    });

    new cdk.CfnOutput(this, "InstancePublicIP", {
      value: elasticIp.ref,
      description: "Elastic IP of the EC2 instance",
    });
  }
}
