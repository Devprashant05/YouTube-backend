import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

// register user route
userRouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    registerUser
);

// login user route
userRouter.route("/login").post(loginUser);

// secured routes
userRouter.route("/logout").post(verifyJWT, logoutUser);

export default userRouter;
