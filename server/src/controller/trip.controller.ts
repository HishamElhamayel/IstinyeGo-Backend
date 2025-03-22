import Booking from "#/models/booking.model";
import Trip from "#/models/trip.model";
import { error } from "console";
import { RequestHandler } from "express";
import { DateTime } from "luxon";
import mongoose, { isValidObjectId } from "mongoose";

export const createTrip: RequestHandler = async (req, res) => {
    try {
        const { shuttleId, routeId, startTime, endTime, date, availableSeats } =
            req.body;

        const duplicates = req.body.duplicates ?? 1;
        const tripsArray = [];

        for (let i = 0; i < duplicates; i++) {
            tripsArray.push({
                shuttle: shuttleId,
                route: routeId,
                startTime: DateTime.fromISO(startTime).plus({ weeks: i }),
                endTime: DateTime.fromISO(endTime).plus({ weeks: i }),
                date: DateTime.fromFormat(date, "yyyy-MM-dd")
                    .plus({ weeks: i })
                    .toFormat("yyyy-MM-dd"),
                availableSeats,
            });
        }

        const trips = await Trip.create(tripsArray);

        res.status(201).json({
            trips,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};

export const deleteTrip: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            res.status(400).json({ error: "Invalid trip ID" });
            return;
        }

        const trip = await Trip.findOneAndDelete({ _id: id });
        if (!trip) {
            res.status(404).json({ error: "Trip not found" });
            return;
        }

        res.json({});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};

export const getTripsByRouteId: RequestHandler = async (req, res) => {
    try {
        const { routeId, date } = req.query as {
            routeId: string;
            date: string;
        };

        if (
            !isValidObjectId(routeId) ||
            !routeId ||
            !date ||
            !Date.parse(date)
        ) {
            res.status(400).json({ error: "Invalid query parameters" });
            return;
        }

        const trips = await Trip.find({ route: routeId, date });

        if (trips.length === 0) {
            res.status(404).json({ error: "No trips found" });
            return;
        }

        res.json({
            trips,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};

export const getTripsByShuttleId: RequestHandler = async (req, res) => {
    const {
        shuttleId,
        date,
        time = date, //if no date is provided, use start of the day
    } = req.query as {
        shuttleId: string;
        date: string;
        time: string;
    };

    console.log("hi");

    if (
        !isValidObjectId(shuttleId) ||
        !shuttleId ||
        !date ||
        !Date.parse(date) ||
        !Date.parse(time)
    ) {
        res.status(400).json({ error: "Invalid query parameters" });
        return;
    }

    const trips = await Trip.find({
        shuttle: shuttleId,
        date,
        endTime: { $gte: time },
    });

    res.json({
        trips,
    });
};

export const getTripById: RequestHandler = async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        // console.log(req.params);
        res.status(400).json({ error: "Invalid trip ID" });
        return;
    }

    const tripId = new mongoose.Types.ObjectId(req.params.id);
    const user = req.user;

    if (user.role === "user") {
        if (await Booking.exists({ trip: tripId, user: user._id })) {
            // console.log("hi");

            const trip = await Trip.aggregate([
                { $match: { _id: tripId } },
                {
                    $unset: "__v",
                },
                {
                    $lookup: {
                        from: "bookings",
                        localField: "_id",
                        foreignField: "trip",
                        as: "booking",
                    },
                },
                { $match: { "booking.user": user._id } },
                {
                    $addFields: {
                        booking: {
                            $filter: {
                                input: "$booking",
                                as: "b",
                                cond: { $eq: ["$$b.user", user._id] }, // Keeps only bookings made by this user
                            },
                        },
                    },
                },
                { $unwind: "$booking" },
                {
                    $addFields: {
                        booking: "$booking._id", // Extract only the `_id` from the booking object
                    },
                },
                {
                    $lookup: {
                        from: "shuttles",
                        localField: "shuttle",
                        foreignField: "_id",
                        as: "shuttle",
                    },
                },
                {
                    $unwind: "$shuttle",
                },
                {
                    $project: {
                        _id: 1,
                        shuttle: {
                            _id: "$shuttle._id",
                            number: "$shuttle.number",
                        },
                        route: 1,
                        startTime: 1,
                        endTime: 1,
                        date: 1,
                        availableSeats: 1,
                        state: 1,
                        booking: 1,
                    },
                },
                {
                    $lookup: {
                        from: "routes",
                        localField: "route",
                        foreignField: "_id",
                        as: "route",
                    },
                },
                { $unwind: "$route" },
                {
                    $project: {
                        _id: 1,
                        shuttle: 1,
                        startLocation: "$route.startLocation.description",
                        endLocation: "$route.endLocation.description",
                        fare: "$route.fare",
                        startTime: 1,
                        endTime: 1,
                        date: 1,
                        availableSeats: 1,
                        state: 1,
                        booking: 1,
                    },
                },
            ]);

            // const trip = await Trip.findById(tripId);
            if (!trip) {
                res.status(404).json({ error: "Trip not found" });
                return;
            }

            res.json({
                trip: trip[0],
            });
            return;
        }
    }

    const trip = await Trip.findById(tripId);

    if (!trip) {
        res.status(404).json({ error: "Trip not found" });
        return;
    }

    res.json({
        trip,
    });
};
