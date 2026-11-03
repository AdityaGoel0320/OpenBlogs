import app from "./app.js";
import cloudinary from "cloudinary";
import { dbConnection } from "./database/dbConnection.js";
import { BlogInteraction } from "./models/blogInteractionSchema.js";
import { Comment } from "./models/commentSchema.js";

cloudinary.v2.config({
  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_CLIENT_API,
  api_secret:
    process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_CLIENT_SECRET,
});

await dbConnection();
await Promise.all([BlogInteraction.init(), Comment.init()]);

const port = process.env.PORT || 7777;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
