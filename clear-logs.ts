/**
 * Vault5 Log Clearing Script
 * 
 * Clears all logs for a specific server from Elasticsearch.
 * 
 * Usage:
 *   npx tsx clear-logs.ts <serverId>
 * 
 * Examples:
 *   npx tsx clear-logs.ts srv_emxy0tr14x
 *   npx tsx clear-logs.ts srv_abc123xyz
 * 
 * Default server ID: srv_emxy0tr14x (change on line 25 if needed)
 * 
 * ⚠️ Warning: This permanently deletes all logs for the specified server!
 */

import { PrismaClient } from "@prisma/client";
import { Client } from "@elastic/elasticsearch";

const prisma = new PrismaClient();

async function main() {
    // ⚙️ CHANGE DEFAULT SERVER ID HERE if needed
    const serverId = process.argv[2] || "srv_emxy0tr14x";

    console.log(`🗑️  Clearing logs for server: ${serverId}\n`);

    const esHost = process.env.ELASTICSEARCH_HOST || "localhost";
    const esPort = process.env.ELASTICSEARCH_PORT || "9200";
    const esUsername = process.env.ELASTICSEARCH_USERNAME || "elastic";
    const esPassword = process.env.ELASTICSEARCH_PASSWORD || "changeme";

    const esClient = new Client({
        node: `http://${esHost}:${esPort}`,
        auth: { username: esUsername, password: esPassword },
    });

    const server = await prisma.server.findUnique({
        where: { id: serverId },
        include: {
            elasticsearchHost: true,
            plan: true,
        },
    });

    if (!server) {
        console.error(`❌ Server ${serverId} not found`);
        return;
    }

    const dataStream = `${server.elasticsearchHost.region}-logs-${server.plan.name.toLowerCase()}`;

    console.log(`📝 Server: ${server.name}`);
    console.log(`   Data Stream: ${dataStream}\n`);

    try {
        // Delete by query - remove all logs for this server
        const result = await esClient.deleteByQuery({
            index: dataStream,
            body: {
                query: {
                    term: {
                        serverId: serverId,
                    },
                },
            },
            refresh: true,
        });

        console.log(`✅ Deleted ${result.deleted} logs for server ${server.name}`);
    } catch (error: any) {
        console.error("❌ Failed to delete logs:", error.message);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error("❌ Failed:", e);
        await prisma.$disconnect();
        process.exit(1);
    });

