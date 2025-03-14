import { RequestHandler } from "express";
import mongoose from "mongoose";
import Booking from "#/models/booking.model";
import Transaction from "#/models/transaction.model";
import Trip from "#/models/trip.model";
import { RouteDocument, WalletDocument } from "#/types/user.types";

export const createBooking: RequestHandler = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { tripId } = req.body;

        // get user wallet
        await req.user.populate("wallet");
        const wallet = req.user.wallet as unknown as WalletDocument;

        // get trip and route
        const trip = await Trip.findById(tripId)
            .populate("route")
            .session(session);
        if (!trip) {
            await session.abortTransaction();
            res.status(404).json({ error: "Trip not found" });
            return;
        }
        const route = trip.route as unknown as RouteDocument;

        // ensure that the trip has available seats
        if (trip.availableSeats === 0) {
            await session.abortTransaction();
            res.status(400).json({ error: "No available seats" });
            return;
        }

        // ensure that the user has enough balance
        if (wallet.balance < route.fare) {
            await session.abortTransaction();
            res.status(400).json({ error: "Insufficient funds" });
            return;
        }

        // create transaction
        const transaction = await Transaction.create(
            [
                {
                    wallet: req.user.wallet,
                    type: "deduct",
                    amount: route.fare,
                    balanceAfterTransaction: wallet.balance - route.fare,
                },
            ],
            { session }
        );

        // create booking
        const booking = await Booking.create(
            [
                {
                    user: req.user._id,
                    trip: trip._id,
                    transaction: transaction[0]._id,
                },
            ],
            { session }
        );

        // update trip
        trip.availableSeats -= 1;
        await trip.save({ session });

        // update wallet
        wallet.balance -= route.fare;
        await wallet.save({ session });

        await session.commitTransaction();

        res.status(201).json({
            booking: booking[0],
        });
    } catch (err) {
        await session.abortTransaction();
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    } finally {
        session.endSession();
    }
};
