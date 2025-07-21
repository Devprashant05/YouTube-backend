// require("dotenv").config({path: './env'});

import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path: "./env",
});

connectDB();

/*
1st way to connect with DB using IIFE
const app = express();
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
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
