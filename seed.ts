import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { customAlphabet } from "nanoid";

const prisma = new PrismaClient();

// ID generators matching your schema
const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  console.log("🗑️  Cleaning existing data...");
  await prisma.apiKey.deleteMany();
  await prisma.logBucket.deleteMany();
  await prisma.defaultLogBucket.deleteMany();
  await prisma.serverMember.deleteMany();
  await prisma.server.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.elasticsearchHost.deleteMany();
  await prisma.user.deleteMany();

  // Create Plans
  console.log("📋 Creating plans...");
  const freePlan = await prisma.plan.create({
    data: {
      id: nanoid(),
      name: "free",
      displayName: "Free",
      retentionDays: 7,
      price: 0,
      stripePriceId: null, // Free plan has no Stripe Price ID
      interval: "month",
      features: JSON.stringify([
        "1GB storage",
        "7 day retention",
        "Basic search",
      ]),
      isActive: true,
    },
  });

  const proPlan = await prisma.plan.create({
    data: {
      id: nanoid(),
      name: "pro",
      displayName: "Pro",
      retentionDays: 30,
      price: 29.99,
      stripePriceId: process.env.STRIPE_PRICE_ID_PRO || "price_pro_placeholder", // Replace with real Stripe Price ID
      interval: "month",
      features: JSON.stringify([
        "50GB storage",
        "30 day retention",
        "Advanced search",
        "Custom alerts",
      ]),
      isActive: true,
    },
  });

  const enterprisePlan = await prisma.plan.create({
    data: {
      id: nanoid(),
      name: "enterprise",
      displayName: "Enterprise",
      retentionDays: 90,
      price: 99.99,
      stripePriceId: process.env.STRIPE_PRICE_ID_ENTERPRISE || "price_enterprise_placeholder", // Replace with real Stripe Price ID
      interval: "month",
      features: JSON.stringify([
        "Unlimited storage",
        "90 day retention",
        "Advanced search",
        "Custom alerts",
        "Priority support",
        "SSO",
      ]),
      isActive: true,
    },
  });

  console.log(`✓ Created ${[freePlan, proPlan, enterprisePlan].length} plans`);

  // Create Elasticsearch Hosts
  console.log("🔍 Creating Elasticsearch hosts...");
  const esHost1 = await prisma.elasticsearchHost.create({
    data: {
      id: nanoid(),
      name: "Vault5 EU",
      host: "localhost",
      port: 9200,
      protocol: "http",
      username: "elastic",
      password: "changeme",
      region: "eu1",
      isActive: true,
    },
  });

  const esHost2 = await prisma.elasticsearchHost.create({
    data: {
      id: nanoid(),
      name: "Vault5 US",
      host: "localhost",
      port: 9200,
      protocol: "http",
      username: "elastic",
      password: "changeme",
      region: "us1",
      isActive: true,
    },
  });

  console.log(`✓ Created ${[esHost1, esHost2].length} Elasticsearch hosts`);

  // Create Users
  console.log("👤 Creating users...");
  const testPassword = await hash("password123", 10);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@vault5.dev",
      name: "Admin User",
      password: testPassword,
      role: "ADMIN",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: "john@vault5.dev",
      name: "John Doe",
      password: testPassword,
      role: "CUSTOMER",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "jane@vault5.dev",
      name: "Jane Smith",
      password: testPassword,
      role: "CUSTOMER",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jane",
    },
  });

  const testUser = await prisma.user.create({
    data: {
      email: "test@example.com",
      name: "Test User",
      password: testPassword,
      role: "CUSTOMER",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=test",
    },
  });

  console.log(`✓ Created ${[adminUser, user1, user2, testUser].length} users`);

  // Create Servers (all start on FREE plan by default)
  console.log("🖥️  Creating servers...");
  const server1 = await prisma.server.create({
    data: {
      id: nanoid(),
      name: "Production API",
      description: "Main production API server logs",
      ownerId: adminUser.id,
      planId: freePlan.id, // Start on free plan
      elasticsearchHostId: esHost1.id,
      elasticsearchIndex: "logs-prod-api",
    },
  });

  const server2 = await prisma.server.create({
    data: {
      id: nanoid(),
      name: "Development Environment",
      description: "Development and testing logs",
      ownerId: user1.id,
      planId: freePlan.id, // Start on free plan
      elasticsearchHostId: esHost1.id,
      elasticsearchIndex: "logs-dev",
    },
  });

  const server3 = await prisma.server.create({
    data: {
      id: nanoid(),
      name: "Personal Project",
      description: "My side project logs",
      ownerId: user2.id,
      planId: freePlan.id, // Start on free plan
      elasticsearchHostId: esHost2.id,
      elasticsearchIndex: "logs-personal",
    },
  });

  console.log(`✓ Created ${[server1, server2, server3].length} servers`);

  // Create Server Members (shared access)
  console.log("👥 Creating server members...");
  const member1 = await prisma.serverMember.create({
    data: {
      userId: user1.id,
      serverId: server1.id,
      role: "EDITOR",
    },
  });

  const member2 = await prisma.serverMember.create({
    data: {
      userId: user2.id,
      serverId: server1.id,
      role: "VIEWER",
    },
  });

  const member3 = await prisma.serverMember.create({
    data: {
      userId: adminUser.id,
      serverId: server2.id,
      role: "ADMIN",
    },
  });

  console.log(`✓ Created ${[member1, member2, member3].length} server members`);

  // Create Default Log Bucket Templates (FiveM-focused)
  console.log("📋 Creating default log bucket templates...");
  const defaultBuckets = [
    {
      id: nanoid(),
      name: "General",
      slug: "general",
      description: "General server logs and system messages",
      sortOrder: 1,
    },
    {
      id: nanoid(),
      name: "Anticheat",
      slug: "anticheat",
      description: "Anti-cheat detections and violations",
      sortOrder: 2,
    },
    {
      id: nanoid(),
      name: "Economy",
      slug: "economy",
      description: "Economy transactions and money logs",
      sortOrder: 3,
    },
    {
      id: nanoid(),
      name: "Events",
      slug: "events",
      description: "Player events and interactions",
      sortOrder: 4,
    },
    {
      id: nanoid(),
      name: "Admin",
      slug: "admin",
      description: "Admin actions and commands",
      sortOrder: 5,
    },
    {
      id: nanoid(),
      name: "Errors",
      slug: "errors",
      description: "Server errors and exceptions",
      sortOrder: 6,
    },
  ];

  for (const bucket of defaultBuckets) {
    await prisma.defaultLogBucket.create({
      data: bucket,
    });
  }

  console.log(`✓ Created ${defaultBuckets.length} default log bucket templates`);

  // Create Log Buckets (copy from default templates)
  console.log("🗂️  Creating log buckets from templates...");
  const createdBuckets = [];

  // Server1 gets all default buckets
  for (const template of defaultBuckets) {
    const bucket = await prisma.logBucket.create({
      data: {
        id: nanoid(),
        name: template.name,
        slug: template.slug,
        description: template.description,
        serverId: server1.id,
      },
    });
    createdBuckets.push(bucket);
  }

  // Server2 gets basic buckets
  const bucket2_1 = await prisma.logBucket.create({
    data: {
      id: nanoid(),
      name: "General",
      slug: "general",
      description: "General server logs",
      serverId: server2.id,
    },
  });
  createdBuckets.push(bucket2_1);

  const bucket2_2 = await prisma.logBucket.create({
    data: {
      id: nanoid(),
      name: "Errors",
      slug: "errors",
      description: "Error logs",
      serverId: server2.id,
    },
  });
  createdBuckets.push(bucket2_2);

  console.log(`✓ Created ${createdBuckets.length} log buckets from templates`);

  // Create API Keys
  console.log("🔑 Creating API keys...");
  const apiKey1 = await prisma.apiKey.create({
    data: {
      id: nanoid(),
      name: "Production Ingest Key",
      key: `vk_${nanoid()}${nanoid()}`,
      serverId: server1.id,
      userId: adminUser.id,
      permissions: JSON.stringify(["logs:write", "logs:read"]),
    },
  });

  const apiKey2 = await prisma.apiKey.create({
    data: {
      id: nanoid(),
      name: "Read-Only Key",
      key: `vk_${nanoid()}${nanoid()}`,
      serverId: server1.id,
      userId: user1.id,
      permissions: JSON.stringify(["logs:read"]),
    },
  });

  const apiKey3 = await prisma.apiKey.create({
    data: {
      id: nanoid(),
      name: "Dev Environment Key",
      key: `vk_${nanoid()}${nanoid()}`,
      serverId: server2.id,
      userId: user1.id,
      permissions: JSON.stringify(["logs:write", "logs:read", "logs:delete"]),
    },
  });

  console.log(`✓ Created ${[apiKey1, apiKey2, apiKey3].length} API keys`);

  console.log("\n✅ Database seeding completed!");
  console.log("\n📊 Summary:");
  console.log(`   Users: ${await prisma.user.count()}`);
  console.log(`   Plans: ${await prisma.plan.count()}`);
  console.log(
    `   Elasticsearch Hosts: ${await prisma.elasticsearchHost.count()}`
  );
  console.log(`   Servers: ${await prisma.server.count()}`);
  console.log(`   Server Members: ${await prisma.serverMember.count()}`);
  console.log(`   Log Buckets: ${await prisma.logBucket.count()}`);
  console.log(`   API Keys: ${await prisma.apiKey.count()}`);
  console.log("\n🔐 Test credentials:");
  console.log("   Email: admin@vault5.dev");
  console.log("   Email: john@vault5.dev");
  console.log("   Email: jane@vault5.dev");
  console.log("   Email: test@example.com");
  console.log("   Password: password123");
  console.log(`\n🔑 Test API Key: ${apiKey1.key}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
