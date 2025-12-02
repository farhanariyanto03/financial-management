import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Get authenticated user from cookies
async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) {
    return { user: null, error: "No access token found" };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user) {
    return { user: null, error: "Invalid session" };
  }

  return { user, error: null };
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    // Validate required fields
    if (!file || !type) {
      return NextResponse.json(
        { error: "File and type are required" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate file type
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only image and PDF files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;

    // Convert File to ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("transaction-images")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("transaction-images")
      .getPublicUrl(uploadData.path);

    const fileUrl = urlData.publicUrl;

    // Create basic transaction record with current date and time
    const currentDateTime = new Date();
    const dateTransaction = currentDateTime.toISOString().split("T")[0]; // YYYY-MM-DD format

    const { data: transactionData, error: transactionError } =
      await supabaseAdmin
        .from("transactions")
        .insert({
          user_id: user.id,
          type: type === "pemasukkan" ? "income" : "expense",
          date_transaction: dateTransaction,
          file: fileUrl,
        })
        .select()
        .single();

    if (transactionError) {
      console.error("Transaction error:", transactionError);

      // Delete uploaded file if transaction fails
      await supabaseAdmin.storage
        .from("transaction-images")
        .remove([uploadData.path]);

      return NextResponse.json(
        { error: "Failed to create transaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: transactionData,
      fileUrl,
      message: "File uploaded and transaction created successfully",
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
