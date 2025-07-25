import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}/${DB_NAME}`
        );
        // To check the log of connectionInstance
        console.log(
            `\n MongoDB Connected !! DB_HOST ${connectionInstance.connection.host}`
        );
    } catch (error) {
        console.log("MONGODB Connection Failed: ", error);
        process.exit(1);
    }
};

export default connectDB;
