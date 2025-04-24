"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useEffect } from "react";

export function LoginForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			setError(error.message);
		} else {
			await new Promise((resolve) => setTimeout(resolve, 500));
			router.refresh();
			router.push("/dashboard");
		}

		setLoading(false);
	};

	useEffect(() => {
		const checkSession = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			console.log("User Session:", session);
		};
		checkSession();
	}, []);

	return (
		<div className="flex w-full h-[70svh] items-center justify-center">
			<div className="w-full max-w-sm">
				<div
					className={cn("flex flex-col gap-6", className)}
					{...props}
				>
					<Card>
						<CardHeader className="flex items-center justify-center">
							<h2 className="text-center text-[#7E57C2] text-4xl font-bold p-2">MISD<span className="text-[#34BFA3] text-4xl font-bold">esk</span></h2>
							<h2 className="text-center text-[#7E57C2] text-l font-semibold">
								Log in to your account
							</h2>
						</CardHeader>
						<CardContent>
							<form onSubmit={onSubmit}>
								<div className="flex flex-col gap-6">
									<div className="grid gap-3">
										<Label htmlFor="email">Email</Label>
										<Input
											id="email"
											type="email"
											style={{ borderColor: '#34BFA3' }}
											placeholder="m@example.com"
											value={email}
											onChange={(e) =>
												setEmail(e.target.value)
											}
											required
										/>
									</div>
									<div className="grid gap-3">
										<div className="flex items-center">
											<Label htmlFor="password">
												Password
											</Label>
										</div>
										<Input
											id="password"
											type="password"
											style={{ borderColor: '#34BFA3' }}
											value={password}
											onChange={(e) =>
												setPassword(e.target.value)
											}
											required
										/>
										{/* <div className="flex items-center justify-between">
											<a
												href="#"
												className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
											>
												Forgot password?
											</a>
										</div> */}
									</div>
									{error && (
										<p className="text-red-500 text-sm">
											{error}
										</p>
									)}{" "}
									{/* ✅ Show error message */}
									<div className="flex flex-col gap-3 ">
										<Button
											type="submit"
											className="w-full !bg-[#34BFA3] hover:!bg-[#52ac9a] text-white"
											disabled={loading}
										>
											{loading
												? "Logging in..."
												: "Login"}{" "}
											{/* ✅ Show loading state */}
										</Button>
									</div>
								</div>
								{/* <div className="mt-4 text-center text-sm">
									Don&apos;t have an account?{" "}
									<Link
										href="/register"
										className="underline underline-offset-4"
									>
										Sign up
									</Link>
								</div> */}
							</form>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
