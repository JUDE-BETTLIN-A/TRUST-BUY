"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

interface SignupResult {
  success: boolean;
  message: string;
  userId?: string;
}

/**
 * Register a new user with email and password
 */
export async function signupUser(
  email: string,
  password: string,
  name?: string
): Promise<SignupResult> {
  // Validate inputs
  if (!email || !password) {
    return { success: false, message: "Email and password are required" };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, message: "Invalid email format" };
  }

  // Validate password strength
  if (password.length < 6) {
    return { success: false, message: "Password must be at least 6 characters" };
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      // If user exists but has no password (OAuth user), allow setting password
      if (!existingUser.passwordHash) {
        const passwordHash = await hashPassword(password);
        await prisma.user.update({
          where: { email: email.toLowerCase() },
          data: { 
            passwordHash,
            name: name || existingUser.name,
          },
        });
        return { 
          success: true, 
          message: "Password set successfully. You can now login with email/password.",
          userId: existingUser.id 
        };
      }
      return { success: false, message: "An account with this email already exists" };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create display name from email if not provided
    const displayName = name || email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name: displayName,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        role: "USER",
        isActive: true,
      },
    });

    return { 
      success: true, 
      message: "Account created successfully! You can now sign in.",
      userId: user.id 
    };
  } catch (error) {
    console.error("Signup error:", error);
    return { success: false, message: "An error occurred during signup. Please try again." };
  }
}

/**
 * Check if email is available for registration
 */
export async function checkEmailAvailable(email: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return !user;
  } catch {
    return false;
  }
}
