/**
 * List all servers with their owners and plans
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const servers = await prisma.server.findMany({
    include: {
      owner: { select: { email: true, name: true } },
      plan: { select: { displayName: true, retentionDays: true } },
      elasticsearchHost: { select: { region: true } }
    },
  });

  if (servers.length === 0) {
    console.log("📭 No servers found. Run 'npm run seed' to create test data.");
    return;
  }

  console.log("\n🖥️  Available Servers:\n");
  console.table(
    servers.map((s) => ({
      "Server ID": s.id,
      "Name": s.name,
      "Owner": s.owner.email,
      "Plan": s.plan.displayName,
      "Retention": `${s.plan.retentionDays} days`,
      "Region": s.elasticsearchHost.region
    }))
  );

  console.log(`\n✓ Found ${servers.length} server(s)\n`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

