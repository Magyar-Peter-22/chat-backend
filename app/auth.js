import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import { Validator } from 'node-input-validator';
import { createUser, findUser } from "../mongodb/userQueries.js";
import { checkV } from "../validator.js";
import { statusErrorCode } from "./expressErrorHandler.js";

const bcryptSalt = 10;

const router = express.Router();

//temporal store
const refreshTokens = ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIxMjMiLCJfaWQiOiI2NzA0ODI0NjM2MWQxY2ZjMmE3NzVkMjYiLCJpYXQiOjE3MjgzNDg3NDIsImV4cCI6MTcyOTY0NDc0Mn0.gkqIPYekT2LvgCIvJE3av6I0PayyZTTZhIR4RbQ_zWc"];

function generateRefreshToken(user) {

    const refreshToken = jwt.sign(
        { _id: user._id },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: "15d",
        }
    );
    refreshTokens.push(refreshToken); // Store the refresh token
    return refreshToken;
}

function generateAccessToken(user) {
    return jwt.sign(
        { _id: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: "15m",
        }
    );
}

router.post("/register", async (req, res) => {
    //validate data
    const v = new Validator(
        req.body,
        {
            username: 'required|username',
            password: "required|password",
        },
    );
    await checkV(v);
    const { username, password } = req.body;

    //check if the username is available
    const existingUser = await findUser({ username })
    if (existingUser)
        statusErrorCode(400, "this username is taken", "taken username");

    //create new user object
    const user = {
        username,
        password_hash: bcrypt.hashSync(password, bcryptSalt),
    }

    //save new user to db
    const created = await createUser(user);

    // Generate tokens
    const accessToken = generateAccessToken(created);
    const refreshToken = generateRefreshToken(created);

    //send the token to the client
    res.json({ accessToken, refreshToken });
});

router.post("/login", async (req, res) => {
    console.log(req.body);
    res.sendStatus(200);
});

router.post("/refresh_token", async (req, res) => {
    //validate data
    const v = new Validator(
        req.body,
        {
            refreshToken: 'required|string',
        },
    );
    await checkV(v);
    const { refreshToken } = req.body;

    //check if the refresh token exists
    if (!refreshTokens.includes(refreshToken)) {
        statusErrorCode(400, "invalid refresh token");
    }

    // Verify refresh token
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) statusErrorCode(400, "invalid refresh token");

        //remove expiration data
        delete (user.iat);
        delete (user.exp);

        // Generate a new access token, what will contain the data from the refresh token
        const newAccessToken = generateAccessToken(user);
        res.json(newAccessToken);
    });
});

export default router;
