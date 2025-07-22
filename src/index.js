// require("dotenv").config({path: './env'});

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./env",
});

connectDB()
    .then(() => {
        // listening the server after connecting db successfully
        app.listen(process.env.PORT || 8800, () => {
            console.log(`App is listening at port: ${process.env.PORT}`);
        });
    })
    .catch((err) => console.log(`Mongo DB Connection failed !!!`, err));

/*
1st way to connect with DB using IIFE
const app = express();
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        // for handling the app/server error
        app.on("error", (error) => {
            console.log("Error: ", error);
            throw error;
        });
        app.listen(process.env.PORT, () => {
            console.log(`App is listening at: ${process.env.PORT}`);
        });
    } catch (error) {
        console.error("ERROR: ", error);
        throw error;
    }
})();
*/
