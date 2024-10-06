import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
    res.json("this is the server");
});

router.post("/register",async (req,res)=>{
    console.log(req.body);
    res.sendStatus(200);
});

router.post("/login",async (req,res)=>{
    console.log(req.body);
    res.sendStatus(200);
});

export default router;
