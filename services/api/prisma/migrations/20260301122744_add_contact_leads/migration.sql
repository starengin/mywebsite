-- CreateTable
CREATE TABLE "ContactLead" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "city" TEXT NOT NULL,
    "material" TEXT,
    "preferred" TEXT,
    "subject" TEXT,
    "details" TEXT NOT NULL,
    "page" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
