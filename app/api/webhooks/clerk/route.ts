import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

interface ClerkEmailAddress {
  email_address: string;
  id: string;
}

interface ClerkUserCreatedEventData {
  id: string;
  email_addresses?: ClerkEmailAddress[];
  primary_email_address_id?: string;
}

interface ClerkWebhookEvent {
  data: ClerkUserCreatedEventData;
  type: string;
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET in environment variables.");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get Svix headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing required svix headers" },
      { status: 400 }
    );
  }

  // Get raw body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: ClerkWebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error("Error verifying Clerk webhook signature:", err);
    return NextResponse.json(
      { error: "Error verifying webhook signature" },
      { status: 400 }
    );
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, primary_email_address_id } = evt.data;

    let primaryEmail = "";
    if (email_addresses && email_addresses.length > 0) {
      const found = email_addresses.find(
        (email) => email.id === primary_email_address_id
      );
      primaryEmail = found ? found.email_address : email_addresses[0].email_address;
    }

    try {
      await connectDB();

      await User.findOneAndUpdate(
        { clerkId: id },
        {
          clerkId: id,
          email: primaryEmail,
        },
        { upsert: true, new: true }
      );

      console.log(`MongoDB User created/updated for clerkId: ${id}`);
    } catch (dbErr) {
      console.error("Database error saving Clerk user:", dbErr);
      return NextResponse.json(
        { error: "Failed to save user to database" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
