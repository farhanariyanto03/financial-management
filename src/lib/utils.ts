import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { supabase } from "./supabaseClient";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getAuthUser() {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      return { user, error: userError };
    }

    return { user: session.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
}
