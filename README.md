# How VPC, Subnets, and Elastic IP Work Together to Run an EC2 Instance on AWS

AWS provides a powerful suite of networking and compute tools to manage and deploy applications. In this article, we’ll explore how VPC (Virtual Private Cloud), subnets, and Elastic IPs work together to deploy and manage an EC2 instance using AWS CDK.

## 1. Virtual Private Cloud (VPC): Isolating Your Network

A VPC is a logically isolated network within AWS, allowing you to control how resources connect internally and externally. It acts as a container for all your networking components, including subnets, route tables, and security groups.

In the provided code, we create a VPC:

```typescript
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
```

•	CIDR Block: Defines the IP address range for the VPC (e.g., 10.0.0.0/16).
•	Subnets: The VPC is divided into smaller subnetworks to organize resources. A public subnet allows internet access for instances.

## 2. Subnets: Structuring Your Network

Subnets are subdivisions of the VPC that group resources into isolated network segments. Each subnet resides in a specific Availability Zone (AZ) for fault tolerance.

In the code:

```typescript
subnetConfiguration: [
  {
    cidrMask: 24,
    name: process.env.SUBNET!,
    subnetType: ec2.SubnetType.PUBLIC,
  },
]
```

## 3. Elastic IP (EIP): Assigning a Fixed Public IP

An Elastic IP (EIP) is a static, public IPv4 address that remains constant even if the EC2 instance stops or restarts. It ensures that clients can always reach your application using the same IP.

In the code:

```typescript
const elasticIp = new ec2.CfnEIP(this, "ElasticIp", {
  instanceId: instance.instanceId,
});
```

•	Elastic IP Allocation: AWS reserves this static IP, which can be assigned to an EC2 instance.
•	Association with EC2: The EIP is linked to the instance for external communication.

## 4. Security Groups: Controlling Network Access

A Security Group is a virtual firewall that governs inbound and outbound traffic for EC2 instances. Here, we configure the security group to allow traffic on specific ports:

```typescript
securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), "Allow SSH access");
securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), "Allow HTTP access");
securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), "Allow HTTPS access");
securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8000), "custom port for node service");
securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8080), "custom port for node service");
```

-	Port 22: Enables SSH for remote access.
-	Ports 80/443: Allow HTTP and HTTPS traffic for web applications.
-	Custom Ports (8000/8080): These are configured for application-specific services.

## 5. EC2 Instance: The Compute Layer

Finally, we deploy the EC2 instance in the public subnet, attaching the VPC, security group, and Elastic IP:

```typescript
const instance = new ec2.Instance(this, process.env.EC2_INSTANCE!, {
  vpc,
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
  machineImage: ec2.MachineImage.latestAmazonLinux(),
  securityGroup,
  keyName,
  role,
  vpcSubnets: {
    subnetType: ec2.SubnetType.PUBLIC,
  },
});
```

  -	Instance Type: Defines the compute power (e.g., t2.micro for lightweight workloads).
  -	Amazon Machine Image (AMI): Specifies the operating system (Amazon Linux 2 in this case).
  -	Key Pair: Used for SSH authentication.
  -	Public Subnet: Ensures the instance can communicate externally.

## 6. Bringing It All Together

The CDK stack provisions:
	1.	A VPC with one public subnet.
	2.	An EC2 instance within the subnet, accessible via SSH, HTTP, HTTPS, and custom ports (8000, 8080).
	3.	An Elastic IP, ensuring a consistent public IP for the instance.

## 7. Outputs

The following output provides the instance’s public IP:

```typescript
new cdk.CfnOutput(this, "InstancePublicIP", {
  value: elasticIp.ref,
  description: "Elastic IP of the EC2 instance",
```

This stack demonstrates how AWS networking components like VPC, subnets, and Elastic IPs create a robust foundation for running applications on EC2. By configuring the VPC, assigning a static IP, and managing security groups, you gain full control over your application’s network and ensure reliable and scalable deployments.



