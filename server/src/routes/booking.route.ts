import { createBooking } from "#/controller/booking.controller";
import { mustAuth } from "#/middleware/auth.middleware";
import { validate } from "#/middleware/validator.middleware";
import { CreateBookingSchema } from "#/utils/validation";
import { Router } from "express";

const router = Router();

router.post("/create", mustAuth, validate(CreateBookingSchema), createBooking);

export default router;
