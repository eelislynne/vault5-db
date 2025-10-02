import { PrismaClient } from "@prisma/client";
import { Client } from "@elastic/elasticsearch";

const prisma = new PrismaClient();

// Sample log messages and actions
const logLevels = ["info", "warn", "error", "debug"];
const actions = [
    "user_login",
    "user_logout",
    "api_request",
    "database_query",
    "cache_hit",
    "cache_miss",
    "file_upload",
    "file_download",
    "payment_processed",
    "email_sent",
    "password_reset",
    "account_created",
    "subscription_renewed",
    "webhook_received",
];

const messages: Record<string, string> = {
    user_login: "User successfully logged in",
    user_logout: "User logged out",
    api_request: "API request processed",
    database_query: "Database query executed",
    cache_hit: "Cache hit for key",
    cache_miss: "Cache miss for key",
    file_upload: "File uploaded successfully",
    file_download: "File downloaded",
    payment_processed: "Payment processed successfully",
    email_sent: "Email notification sent",
    password_reset: "Password reset requested",
    account_created: "New user account created",
    subscription_renewed: "Subscription renewed",
    webhook_received: "Webhook payload received",
};

function generateRandomLog(action: string, serverId: string, bucket: string) {
    const level = logLevels[Math.floor(Math.random() * logLevels.length)];
    const message = messages[action];
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const timestamp = new Date(
        sevenDaysAgo + Math.random() * (now - sevenDaysAgo)
    );

    return {
        "@timestamp": timestamp.toISOString(),
        level,
        message,
        metadata: {
            action,
            userId: `user_${Math.floor(Math.random() * 1000)}`,
            requestId: `req_${Math.random().toString(36).substring(7)}`,
            duration: Math.floor(Math.random() * 1000),
        },
        data: {
            ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            statusCode: Math.random() > 0.8 ? 500 : 200,
        },
        serverId,
        bucket,
    };
}

async function main() {
    const serverId = process.argv[2] || "srv_emxy0tr14x";
    const logsCount = parseInt(process.argv[3]) || 100;

    console.log(`🌱 Seeding ${logsCount} logs for server: ${serverId}\n`);

    // Get Elasticsearch connection details
    const esHost = process.env.ELASTICSEARCH_HOST || "localhost";
    const esPort = process.env.ELASTICSEARCH_PORT || "9200";
    const esUsername = process.env.ELASTICSEARCH_USERNAME || "elastic";
    const esPassword = process.env.ELASTICSEARCH_PASSWORD || "changeme";

    // Create Elasticsearch client
    const esClient = new Client({
        node: `http://${esHost}:${esPort}`,
        auth: {
            username: esUsername,
            password: esPassword,
        },
    });

    // Test connection
    try {
        const health = await esClient.cluster.health();
        console.log(`✓ Elasticsearch cluster status: ${health.status}`);
    } catch (error) {
        console.error("❌ Failed to connect to Elasticsearch:", error);
        console.log("\n💡 Make sure Elasticsearch is running on port 9200");
        return;
    }

    // Get server details
    const server = await prisma.server.findUnique({
        where: { id: serverId },
        include: {
            logBuckets: true,
            elasticsearchHost: true,
            plan: true,
        },
    });

    if (!server) {
        console.error(`❌ Server ${serverId} not found`);
        return;
    }

    const buckets = server.logBuckets.length > 0
        ? server.logBuckets.map((b) => b.name)
        : ["default"];

    // Use data stream format: {region}-logs-{plan}
    const dataStream = `${server.elasticsearchHost.region}-logs-${server.plan.name.toLowerCase()}`;

    console.log(`📝 Server: ${server.name}`);
    console.log(`   Data Stream: ${dataStream}`);
    console.log(`   Buckets: ${buckets.join(", ")}\n`);

    // Generate logs
    for (let i = 0; i < logsCount; i++) {
        const action = actions[Math.floor(Math.random() * actions.length)];
        const bucket = buckets[Math.floor(Math.random() * buckets.length)];
        const log = generateRandomLog(action, server.id, bucket);

        try {
            await esClient.index({
                index: dataStream,
                document: log,
            });
        } catch (error) {
            console.error(`   ✗ Failed to index log:`, error);
        }

        if ((i + 1) % 20 === 0) {
            console.log(`   ✓ Indexed ${i + 1}/${logsCount} logs`);
        }
    }

    console.log(`\n✅ Successfully seeded ${logsCount} logs for ${server.name}!`);
    console.log(`\n💡 View them at: http://localhost:3000/server/${serverId}/logs`);
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

