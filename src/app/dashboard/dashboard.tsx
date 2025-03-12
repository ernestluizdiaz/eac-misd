"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function Dashboard() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkUser = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session) {
				router.push("/"); // Redirect to login if not logged in
			} else {
				setLoading(false); // Allow access
			}
		};

		checkUser();
	}, [router]);

	if (loading) return <p>Loading...</p>; // Prevent flashing the dashboard

	return (
		<div>
			<h1>Dashboard</h1>
			<Link
				href="#"
				onClick={async () => {
					const { error } = await supabase.auth.signOut();
					if (error) {
						console.error("Error logging out:", error);
					} else {
						window.location.href = "/";
					}
				}}
			>
				Logout
			</Link>
		</div>
	);
}
