import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.route.js";

const app = express();

// setting for CORS (Cross origin resource sharing) -> Connecting frontend to backend
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

// this is used for if getting the data through json.
app.use(
    express.json({
        limit: "16kb",
    })
);

// this is used for if getting the data on url.
app.use(
    express.urlencoded({
        extended: true,
        limit: "16kb",
    })
);

// this is store and get the static files like images, favicon
app.use(express.static("public"));

// this is used for handle the users browser cookies for CRUD operations through server.
app.use(cookieParser());

// routes
app.use("/api/v1/users", userRouter);

export { app };
