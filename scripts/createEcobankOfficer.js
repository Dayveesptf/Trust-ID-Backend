import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../src/models/User.js";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in your environment.");
}

const officer = {
  firstName: "TrustID",
  lastName: "Analyst",
  email: "analyst@ecobank.com",
  phone: "08000000000",
  password: "EcobankDemo123!",
  role: "ECOBANK_OFFICER",
};

async function createEcobankOfficer() {
  try {
    await mongoose.connect(MONGODB_URI);

    console.log("Connected to MongoDB.");

    const existingUser = await User.findOne({
      email: officer.email.toLowerCase(),
    });

    if (existingUser) {
      console.log(
        `Account already exists: ${officer.email}`
      );

      if (existingUser.role !== "ECOBANK_OFFICER") {
        existingUser.role = "ECOBANK_OFFICER";
        await existingUser.save();

        console.log(
          "Existing account role updated to ECOBANK_OFFICER."
        );
      }

      return;
    }

    const hashedPassword = await bcrypt.hash(
      officer.password,
      12
    );

    const user = await User.create({
      firstName: officer.firstName,
      lastName: officer.lastName,
      email: officer.email,
      phone: officer.phone,
      password: hashedPassword,
      role: officer.role,
      onboardingCompleted: true,
      consent: {
        granted: true,
        grantedAt: new Date(),
        version: "v1",
      },
    });

    console.log("Ecobank officer created successfully.");
    console.log("----------------------------------------");
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${officer.password}`);
    console.log(`Role: ${user.role}`);
    console.log("----------------------------------------");
  } catch (error) {
    console.error("Failed to create Ecobank officer:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

createEcobankOfficer();
