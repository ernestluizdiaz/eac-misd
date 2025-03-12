import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function middleware(req: NextRequest) {
	const { data: { session } } = await supabase.auth.getSession();

	// If not logged in, redirect to login page
	if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
		return NextResponse.redirect(new URL("/", req.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*"], // Protects all routes under /dashboard
};
