"use server";
import { db, auth } from "@/firebase/admin";
import { cookies } from "next/headers";

const oneWeek = 60 * 60 * 24 * 7;
export async function signUp(params: SignUpParams) {
  const { uid, name, email } = params;

  try {
    const userRecord = await db.collection("users").doc(uid).get();
    if (userRecord.exists) {
      return {
        success: false,
        message: "User Already Exists. Please Sign In Instead.",
      };
    }
    await db.collection("users").doc(uid).set({
      name,
      email,
    });

    return {
      success: true,
      message: "User created successfully!",
    };
  } catch (error: any) {
    console.error("Error creating a user", error);
    if (error.code === "auth/email-already-exists") {
      return {
        success: false,
        message: "Email Already exists.",
      };
    }
    return {
      success: false,
      message: "Failed to Create a new user.",
    };
  }
}

export async function signIn(params: SignInParams) {
  const { email, idToken } = params;
  try {
    const userRecord = await auth.getUserByEmail(email);
    if (!userRecord) {
      return {
        success: false,
        message: "No user Found!",
      };
    }
    await setSessionCookie(idToken);
  } catch (error) {
    console.log(error);
    return {
      succes: false,
      message: "Failed to log into account.",
    };
  }
}

export async function logOut() {
  const cookieStore = await cookies();
  cookieStore.delete("session"); // Replace with your cookie key
  return true;
}

export async function setSessionCookie(idToken: string) {
  const cookieStore = await cookies();

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: oneWeek * 1000,
  });
  cookieStore.set("session", sessionCookie, {
    maxAge: oneWeek,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) {
    return null;
  }

  try {
    //verify session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    //fetch user from firestore using uid from decodedClaims
    const userRecord = await db
      .collection("users")
      .doc(decodedClaims.uid)
      .get();

    if (!userRecord.exists) {
      return null;
    }

    return {
      ...userRecord.data(),
      id: userRecord.id,
    } as User;
  } catch (error: any) {
    console.error("Error getting current user:", error);
    // Check if the error is related to session cookie verification failure
    if (error.code === "auth/argument-error") {
      console.error("Invalid session cookie.");
    }
    return null;
  }
}

export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}


