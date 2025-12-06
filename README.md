Below is a **clean, structured, developer-friendly daily execution ticket** you can use to guide delivery of the described LDF backend architecture and logic.
It is broken into **phases, deliverables, acceptance criteria, and required artifacts** — just like an engineering sprint ticket.

---

# ✅ **LDF BACKEND — DAILY EXECUTION TICKET**

## **📌 Day Title:**

**Implement Core LDF Backend Logic (Activation, Earnings Engine, Ledgers & Integrations)**

## **📌 Objective for Today:**

Deliver the foundational components of the **Earnings Engine**, **Activation Flow**, and **Financial Ledger Logic** for the LDF platform, ensuring all operations run through **atomic database transactions** and preserve financial integrity.

---

# 🧩 **TASK STRUCTURE**

---

## **1. Data Layer Finalization (Prisma Schema Review & Adjustments)**

### **Tasks**

* Verify schema for: `User`, `Earning`, `Coupon`, `Investment`, `Withdrawal`.
* Ensure all foreign keys, cascading rules, and unique constraints are correct.
* Add missing indexes (referrerId, sponsorId, userId on Earning, couponCode, etc.).
* Implement enums where needed (EarningType, WithdrawalStatus, InvestmentTier).

### **Deliverables**

* Updated `/prisma/schema.prisma`
* Successful `npx prisma migrate dev`

### **Acceptance Criteria**

* Schema compiles without warnings
* All tables and relations match the business logic described

---

## **2. Implement Coupon Activation Flow (₦3,000 Activation Route)**

### **Tasks**

* Build `/api/activate` controller/service.
* Validate coupon:

  * Exists
  * Not used
  * Owned by an authenticated Agent
* Create activation record & mark coupon as used.
* Begin 1 transaction (`prisma.$transaction`).

### **Deliverables**

* Activation Service in `/services/activationService.js`
* Validation middleware

### **Acceptance Criteria**

* Activation must fail gracefully outside transaction
* Coupon cannot be reused

---

## **3. Build the Earnings Engine (triggerActivationPayouts)**

### **Tasks**

* Implement main payout engine inside a **single transaction**:

  1. **Referral Bonus:** ₦1,000 → direct referrer
  2. **Global Pool Allocation:** ₦1,000 → pool ledger
  3. **Operations Cost:** ₦500 → internal ledger
  4. **Matrix Split:** Identify 5-level upline and credit:

     * Level 1 → ₦200
     * Level 2 → ₦100
     * Level 3 → ₦70
     * Level 4 → ₦60
     * Level 5 → ₦70

* Ensure each payout is recorded as *separate Earning entries*.

### **Deliverables**

* `/services/earningsEngine.js`
* `/services/matrixService.js`

### **Acceptance Criteria**

* If any payout fails → rollback everything
* All earning entries reflect exact sums
* Upline tracing returns correct 5-level hierarchy

---

## **4. Implement Matrix Upline Retrieval Logic**

### **Tasks**

* Build recursive or iterative trace function:

  * Input: newUserId
  * Output: array of up to 5 sponsor IDs
* Consider missing levels (null sponsor should break the chain).

### **Deliverables**

* `getUplineHierarchy(userId)` utility

### **Acceptance Criteria**

* Function always returns stable 0–5 IDs
* Works even for deep trees (stress-tested)

---

## **5. Integrate Payment Gateway Webhooks (Premium Tier Activation)**

### **Tasks**

* Create `/webhooks/payment` handler
* Verify:

  * Signature
  * Payment status
  * Correct amount
* On success:

  * Create Investment record
  * Flip isPremium = true
  * Write ledger entry

### **Deliverables**

* `/controllers/webhookController.js`

### **Acceptance Criteria**

* Webhook idempotency implemented
* Only verified payments unlock Premium tier
* Invalid webhook bodies are rejected (403/400)

---

## **6. Withdrawal Engine (Multi-Currency)**

### **Tasks**

* Build `/api/withdraw` route.
* Validate:

  * User balance ≥ requested amount
  * User KYC + bank/mobile money details
* Trigger payment gateway transfer API.

### **Deliverables**

* `/services/withdrawalService.js`

### **Acceptance Criteria**

* Creates Withdrawal record (Pending → Approved → Paid)
* Only server can update payout to “Paid” (after gateway callback)

---

## **7. Automation Layer (Cron Jobs)**

### **Tasks**

* Add schedulers:

  1. **Monthly Global Pool ROI distribution**
  2. **Quarterly Premium ROI distribution**
* Create separate worker file (`cron/ledgerJobs.js`)

### **Deliverables**

* Working cron job runners

### **Acceptance Criteria**

* Tasks are isolated from user API
* All payouts recorded as Earning transactions

---

## **8. Agent Tools & Admin Controls**

### **Tasks**

* Build:

  * Coupon generation endpoint
  * Admin upgrade endpoint (isAgent flag)
* Add rate-limiting where needed

### **Deliverables**

* `/controllers/agentController.js`
* `/controllers/adminController.js`

### **Acceptance Criteria**

* Coupons generated with UUID / secure pattern
* History and ownership tracked properly

---

# 📌 **End-of-Day Checklist**

Before closing this ticket, ensure:

### ✔ All routes tested in Postman

### ✔ All major services wrapped in try/catch and Prisma transactions

### ✔ All financial entries recorded in Earning table

### ✔ Error responses follow consistent format

### ✔ Webhook endpoint tested with mock payload

### ✔ Database rollback tested intentionally

---

# 📌 **Expected Output (By Day’s End)**

A stable backend foundation where:

* Activation works end-to-end
* Payout engine is functional
* Upline logic distributes correctly
* Webhooks update investments
* Ledgers are consistent and auditable
* No double credits or duplicate payouts
* Cron jobs are stubbed and ready for production

---

If you want, I can also generate:

✅ API documentation for all routes
✅ Folder structure template
✅ Flow diagrams for each subsystem
✅ Test cases for each process
Just tell me which you want.
