import Route from "#/models/route.model";
import { RequestHandler } from "express";

export const createRoute: RequestHandler = async (req, res) => {
    try {
        const { startLocation, endLocation, fare } = req.body;

        const route = await Route.create({
            startLocation,
            endLocation,
            fare,
        });

        res.status(201).json({
            route: route,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};

export const getAllRoutes: RequestHandler = async (req, res) => {
    try {
        const routes = await Route.find({});

        res.status(201).json({
            routes: routes,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};

export const updateRoute: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const { startLocation, endLocation, fare } = req.body;
        console.log(id);

        const route = await Route.findByIdAndUpdate(id, {
            startLocation,
            endLocation,
            fare,
        });

        res.json({
            route: route,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};

export const deleteRoute: RequestHandler = async (req, res) => {
    try {
        const { id } = req.params;

        await Route.findByIdAndDelete(id);

        // if (!route) {
        //     res.status(404).json({ error: "Route not found" });
        //     return;
        // }

        res.status(204).json({});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};
