import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// config the cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        //if file not found return null or can give error file not found.
        if (!localFilePath) return null;

        //upload the file on cloudinary
        const uploadResult = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        // file has been uploaded successfully
        // console.log("File is uploaded on cloudinary", uploadResult.url);
        fs.unlinkSync(localFilePath);
        // console.log(uploadResult);
        return uploadResult;
    } catch (error) {
        fs.unlinkSync(localFilePath); // remove the locally saved temp file as the upload operation got failed
        return null;
    }
};

export { uploadOnCloudinary };
