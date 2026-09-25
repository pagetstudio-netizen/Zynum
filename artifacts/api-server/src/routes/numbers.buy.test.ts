import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type { Response } from "express";
import {
  db,
  discountCodesTable,
  ordersTable,
  usersTable,
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import type { AuthRequest } from "../middlewares/authMiddleware.js";
import { initDb } from "../lib/initDb.js";
import { applyTieredPricing } from "../lib/pricing.js";
import type { FiveSimOrder } from "../lib/fivesim.js";
import { applyDiscountCode } from "./discounts.js";
import { createBuyNumberHandler } from "./numbers.js";

const createdUserIds: number[] = [];
const createdOrderIds: number[] = [];
const createdDiscountIds: number[] = [];

function providerOrder(id: number, price: number, status = "PENDING"): FiveSimOrder {
  return {
    id,
    phone: "+15550000000",
    operator: "any",
    product: "telegram",
    price,
    status,
    expires: new Date(Date.now() + 60_000).toISOString(),
    sms: [],
    created_at: new Date().toISOString(),
  };
}

async function createUser(balanceUsd: number) {
  const [user] = await db
    .insert(usersTable)
    .values({
      name: "Buy Test",
      email: `buy-test-${randomUUID()}@example.test`,
      passwordHash: "test-only",
      balanceUsd,
    })
    .returning();
  createdUserIds.push(user.id);
  return user;
}

async function createDiscount() {
  const [discount] = await db
    .insert(discountCodesTable)
    .values({
      code: `TEST-${randomUUID().slice(0, 8).toUpperCase()}`,
      percent: 50,
      isActive: true,
    })
    .returning();
  createdDiscountIds.push(discount.id);
  return discount;
}

function makeResponse() {
  const result: { status: number; body: unknown } = { status: 200, body: undefined };
  const response = {
    status(code: number) {
      result.status = code;
      return response;
    },
    json(body: unknown) {
      result.body = body;
      return response;
    },
  } as unknown as Response;
  return { response, result };
}

function makeRequest(userId: number, discountCode?: string) {
  return {
    userId,
    body: {
      service: "telegram",
      country: "usa",
      currency: "USD",
      operator: "any",
      ...(discountCode ? { discountCode } : {}),
    },
  } as AuthRequest;
}

function baseServices(overrides: Partial<Parameters<typeof createBuyNumberHandler>[0]> = {}) {
  return {
    getOperatorsForServiceCountry: async () => [
      { name: "any", label: "Automatic", priceUsd: 0.42, priceFcfa: 260, available: 10 },
    ],
    buyNumber: async () => providerOrder(900_000_001, 0.42),
    cancelOrder: async (id: number) => providerOrder(id, 0.42, "CANCELED"),
    applyDiscountCode,
    notifyPurchase: async () => {},
    ...overrides,
  };
}

before(async () => {
  await initDb();
});

after(async () => {
  if (createdOrderIds.length > 0) {
    await db.delete(ordersTable).where(inArray(ordersTable.id, createdOrderIds));
  }
  if (createdDiscountIds.length > 0) {
    await db.delete(discountCodesTable).where(inArray(discountCodesTable.id, createdDiscountIds));
  }
  if (createdUserIds.length > 0) {
    await db.delete(usersTable).where(inArray(usersTable.id, createdUserIds));
  }
});

test("refuse un solde insuffisant sans appeler 5SIM", async () => {
  const user = await createUser(0);
  let buyCalls = 0;
  const handler = createBuyNumberHandler(baseServices({
    buyNumber: async () => {
      buyCalls += 1;
      return providerOrder(900_000_002, 0.42);
    },
  }));
  const { response, result } = makeResponse();

  await handler(makeRequest(user.id), response);

  assert.equal(result.status, 400);
  assert.deepEqual(result.body, {
    error: "INSUFFICIENT_BALANCE",
    message: "Solde insuffisant. Veuillez recharger votre compte.",
    balanceUsd: 0,
    requiredUsd: applyTieredPricing(0.42).priceUsd,
  });
  assert.equal(buyCalls, 0);

  const orders = await db.select({ id: ordersTable.id }).from(ordersTable).where(eq(ordersTable.userId, user.id));
  assert.equal(orders.length, 0);
});

test("enregistre et retourne l'origine API des achats faits avec une clé API", async () => {
  const user = await createUser(5);
  const handler = createBuyNumberHandler(baseServices({
    buyNumber: async () => providerOrder(900_000_030, 0.42),
  }));
  const { response, result } = makeResponse();
  const request = makeRequest(user.id);
  request.userApiKey = "zyn_test_api_key";

  await handler(request, response);

  assert.equal(result.status, 200);
  const returnedOrder = (result.body as { order: { purchaseSource: string } }).order;
  assert.equal(returnedOrder.purchaseSource, "api");

  const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, user.id));
  createdOrderIds.push(...orders.map((order) => order.id));
  assert.equal(orders.length, 1);
  assert.equal(orders[0].purchaseSource, "api");
});

test("deux achats concurrents ne peuvent débiter le compte qu'une fois", async () => {
  const discount = await createDiscount();
  const basePrice = applyTieredPricing(0.42);
  const discountedPrice = await applyDiscountCode(
    discount.code,
    "usa",
    basePrice.priceUsd,
    basePrice.priceFcfa,
    { recordUsage: false },
  );
  assert.equal(discountedPrice.discountId, discount.id);
  const initialBalance = discountedPrice.finalPriceUsd + 0.01;
  const user = await createUser(initialBalance);
  let buyCalls = 0;
  const canceledIds: number[] = [];
  let releaseBuys!: () => void;
  const bothBuysStarted = new Promise<void>((resolve) => {
    releaseBuys = resolve;
  });

  const handler = createBuyNumberHandler(baseServices({
    buyNumber: async () => {
      buyCalls += 1;
      const id = 900_000_010 + buyCalls;
      if (buyCalls === 2) releaseBuys();
      await bothBuysStarted;
      return providerOrder(id, 0.42);
    },
    cancelOrder: async (id: number) => {
      canceledIds.push(id);
      return providerOrder(id, 0.42, "CANCELED");
    },
  }));
  const first = makeResponse();
  const second = makeResponse();

  await Promise.all([
    handler(makeRequest(user.id, discount.code), first.response),
    handler(makeRequest(user.id, discount.code), second.response),
  ]);

  assert.deepEqual([first.result.status, second.result.status].sort(), [200, 400]);
  const failed = [first.result, second.result].find((result) => result.status === 400);
  assert.equal((failed?.body as { error: string }).error, "INSUFFICIENT_BALANCE");
  assert.equal(canceledIds.length, 1);

  const [updatedUser] = await db
    .select({ balanceUsd: usersTable.balanceUsd })
    .from(usersTable)
    .where(eq(usersTable.id, user.id));
  assert.ok(
    Math.abs(updatedUser.balanceUsd - (initialBalance - discountedPrice.finalPriceUsd)) < 0.000001,
    `expected one discounted debit, received balance ${updatedUser.balanceUsd}`,
  );

  const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, user.id));
  assert.equal(orders.length, 1);
  createdOrderIds.push(...orders.map((order) => order.id));
  assert.equal(orders[0].priceUsd, discountedPrice.finalPriceUsd);

  const [updatedDiscount] = await db
    .select({
      id: discountCodesTable.id,
      code: discountCodesTable.code,
      isActive: discountCodesTable.isActive,
      usedCount: discountCodesTable.usedCount,
    })
    .from(discountCodesTable)
    .where(eq(discountCodesTable.id, discount.id));
  assert.equal(
    updatedDiscount.usedCount,
    1,
    `expected one promo use, received ${JSON.stringify(updatedDiscount)}`,
  );
});

test("retourne une erreur de nettoyage si le débit concurrent échoue et que 5SIM ne confirme pas l'annulation", async () => {
  const quotedPrice = applyTieredPricing(0.42).priceUsd;
  const actualPrice = applyTieredPricing(0.8).priceUsd;
  const user = await createUser(quotedPrice + 0.01);
  let cancelCalls = 0;
  const handler = createBuyNumberHandler(baseServices({
    buyNumber: async () => providerOrder(900_000_020, 0.8),
    cancelOrder: async () => {
      cancelCalls += 1;
      throw new Error("provider timeout");
    },
  }));
  const { response, result } = makeResponse();

  await handler(makeRequest(user.id), response);

  assert.equal(actualPrice > quotedPrice, true);
  assert.equal(result.status, 503);
  assert.deepEqual(result.body, {
    error: "PURCHASE_CLEANUP_PENDING",
    message: "L’achat n’a pas été enregistré et son annulation fournisseur reste à confirmer. Ne relancez pas cet achat; contactez le support.",
  });
  assert.equal(cancelCalls, 1);

  const [updatedUser] = await db
    .select({ balanceUsd: usersTable.balanceUsd })
    .from(usersTable)
    .where(eq(usersTable.id, user.id));
  assert.equal(updatedUser.balanceUsd, quotedPrice + 0.01);

  const orders = await db.select({ id: ordersTable.id }).from(ordersTable).where(eq(ordersTable.userId, user.id));
  assert.equal(orders.length, 0);
});