import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import {
  db,
  ordersTable,
  transactionsTable,
  usersTable,
} from "@workspace/db";
import { and, eq, inArray } from "drizzle-orm";
import { initDb } from "./initDb.js";
import { refundOrder, type FiveSimRefundClient } from "./orderRefund.js";
import type { FiveSimOrder } from "./fivesim.js";

const createdUserIds: number[] = [];
const createdOrderIds: number[] = [];

function remoteOrder(
  externalId: number,
  status: string,
  sms: FiveSimOrder["sms"] = [],
): FiveSimOrder {
  return {
    id: externalId,
    phone: "+15550000000",
    operator: "any",
    product: "telegram",
    price: 1,
    status,
    expires: new Date(Date.now() + 60_000).toISOString(),
    sms,
    created_at: new Date().toISOString(),
  };
}

async function createOrder(priceUsd = 2) {
  const [user] = await db
    .insert(usersTable)
    .values({
      name: "Refund Test",
      email: `refund-test-${randomUUID()}@example.test`,
      passwordHash: "test-only",
      balanceUsd: 10,
    })
    .returning();
  createdUserIds.push(user.id);

  const externalId = Math.floor(100_000_000 + Math.random() * 800_000_000);
  const [order] = await db
    .insert(ordersTable)
    .values({
      userId: user.id,
      externalId: String(externalId),
      phone: "+15550000000",
      service: "telegram",
      serviceName: "Telegram",
      country: "usa",
      countryName: "USA",
      status: "PENDING",
      priceUsd,
      priceFcfa: priceUsd * 620,
      currency: "USD",
    })
    .returning();
  createdOrderIds.push(order.id);

  return { user, order, externalId };
}

before(async () => {
  await initDb();
});

after(async () => {
  if (createdOrderIds.length > 0) {
    await db
      .delete(transactionsTable)
      .where(inArray(transactionsTable.reference, createdOrderIds.map((id) => `order_refund:${id}`)));
    await db.delete(ordersTable).where(inArray(ordersTable.id, createdOrderIds));
  }
  if (createdUserIds.length > 0) {
    await db.delete(usersTable).where(inArray(usersTable.id, createdUserIds));
  }
});

test("deux remboursements simultanés ne créditent qu'une seule fois", async () => {
  const { user, order, externalId } = await createOrder(2);
  const client: FiveSimRefundClient = {
    checkOrder: async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      return remoteOrder(externalId, "CANCELED");
    },
    cancelOrder: async () => remoteOrder(externalId, "CANCELED"),
  };

  const results = await Promise.all([
    refundOrder(order.id, client),
    refundOrder(order.id, client),
  ]);

  assert.equal(results.filter((result) => result.status === "refunded").length, 1);

  const [updatedUser] = await db
    .select({ balanceUsd: usersTable.balanceUsd })
    .from(usersTable)
    .where(eq(usersTable.id, user.id));
  assert.equal(updatedUser.balanceUsd, 12);

  const refunds = await db
    .select({ id: transactionsTable.id })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.type, "refund"),
        eq(transactionsTable.reference, `order_refund:${order.id}`),
      ),
    );
  assert.equal(refunds.length, 1);
});

test("une erreur réseau 5SIM restaure la commande sans crédit", async () => {
  const { user, order } = await createOrder(3);
  const client: FiveSimRefundClient = {
    checkOrder: async () => {
      throw new Error("network unavailable");
    },
    cancelOrder: async () => {
      throw new Error("should not be called");
    },
  };

  const result = await refundOrder(order.id, client);
  assert.equal(result.status, "retry");

  const [updatedOrder] = await db.select().from(ordersTable).where(eq(ordersTable.id, order.id));
  const [updatedUser] = await db
    .select({ balanceUsd: usersTable.balanceUsd })
    .from(usersTable)
    .where(eq(usersTable.id, user.id));
  assert.equal(updatedOrder.status, "PENDING");
  assert.equal(updatedOrder.refundToken, null);
  assert.equal(updatedUser.balanceUsd, 10);
});

test("un SMS présent dans une entrée ultérieure interdit le remboursement", async () => {
  const { user, order, externalId } = await createOrder(4);
  const client: FiveSimRefundClient = {
    checkOrder: async () =>
      remoteOrder(externalId, "RECEIVED", [
        { created_at: "", date: "", sender: "", text: "", code: "" },
        { created_at: "", date: "", sender: "Telegram", text: "Code 12345", code: "12345" },
      ]),
    cancelOrder: async () => {
      throw new Error("should not be called");
    },
  };

  const result = await refundOrder(order.id, client);
  assert.equal(result.status, "not_refundable");

  const [updatedOrder] = await db.select().from(ordersTable).where(eq(ordersTable.id, order.id));
  const [updatedUser] = await db
    .select({ balanceUsd: usersTable.balanceUsd })
    .from(usersTable)
    .where(eq(usersTable.id, user.id));
  assert.equal(updatedOrder.status, "RECEIVED");
  assert.equal(updatedOrder.smsCode, "12345");
  assert.equal(updatedUser.balanceUsd, 10);
});