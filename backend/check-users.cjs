const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" }
  });

  console.log("=== Users in Production ===");
  console.log("Total:", users.length);
  console.log("");

  users.forEach(u => {
    const date = u.createdAt.toISOString().split("T")[0];
    const status = u.isActive ? "Active" : "Inactive";
    console.log(`${u.email} | ${u.role} | ${status} | ${date}`);
  });

  await prisma.$disconnect();
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
