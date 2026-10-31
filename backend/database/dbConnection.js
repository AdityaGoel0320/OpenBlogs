import mongoose from "mongoose";

export const dbConnection = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is required to connect to MongoDB.");
  }

  await mongoose.connect(uri);
  console.log("Connected to the database");
};
