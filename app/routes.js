import express from "express";
import authRouter from "./auth.js";

const router = express.Router();

router.get("/", (req, res) => {
    res.json("this is the server");
});

router.use("/auth",authRouter);

export default router;
