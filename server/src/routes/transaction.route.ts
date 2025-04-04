import {
    getAllTransactions,
    getTransactionsByWalletId,
} from "#/controller/transaction.controller";
import { mustAuth, mustRoles } from "#/middleware/auth.middleware";
import { validate } from "#/middleware/validator.middleware";
import { CreateTransactionSchema } from "#/utils/validation";
import { Router } from "express";

const router = Router();

// router.post(
//     "/create",
//     mustAuth,
//     validate(CreateTransactionSchema),
//     createTransaction
// );
router.get("/get-transactions", mustAuth, getTransactionsByWalletId);
router.get("/", mustAuth, mustRoles("admin"), getAllTransactions);

export default router;
