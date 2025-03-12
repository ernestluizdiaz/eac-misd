"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabase } from "@/lib/supabaseClient"; // Ensure correct import path
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/../public/img/logo.png";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

//  Define validation schema with display name
const formSchema = z
	.object({
		displayName: z.string().min(2, {
			message: "Display name must be at least 2 characters.",
		}),
		email: z.string().email({
			message: "Invalid email address.",
		}),
		password: z.string().min(6, {
			message: "Password must be at least 6 characters.",
		}),
		confirmPassword: z.string().min(6, {
			message: "Confirm Password must be at least 6 characters.",
		}),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

export function ProfileForm() {
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const router = useRouter();

	// ✅ Initialize useForm with real-time validation enabled
	const form = useForm({
		resolver: zodResolver(formSchema),
		mode: "onChange",
		defaultValues: {
			displayName: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	// ✅ Handle form submission
	const onSubmit = async (data: {
		email: string;
		password: string;
		displayName: string;
	}) => {
		setLoading(true);
		setError(null);

		const { email, password, displayName } = data;

		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					displayName, // Store the display name in user metadata
				},
			},
		});

		if (error) {
			setError(error.message);
		} else {
			toast.success("Your account has been created.");
			setTimeout(() => {
				router.push("/"); // Redirect to login page
			}, 2000); // Wait 2 seconds before redirecting
		}

		setLoading(false);
	};

	return (
		<div className="bg-card text-card-foreground flex flex-col gap-3 rounded-xl border py-6 shadow-sm p-6">
			<div className="flex justify-center">
				<Image src={Logo} alt="Logo" width={75} height={75} />
			</div>
			<h1 className="text-2xl font-bold mb-6 text-center text-primary">
				Create New Account
			</h1>

			{error && <p className="text-red-500 text-center">{error}</p>}

			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-5"
				>
					{/* Display Name Field */}
					<FormField
						control={form.control}
						name="displayName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Display Name</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* Email Field */}
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input type="email" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					{/* Password Field */}
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Password</FormLabel>
								<FormControl>
									<Input type="password" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					{/* Confirm Password Field */}
					<FormField
						control={form.control}
						name="confirmPassword"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Confirm Password</FormLabel>
								<FormControl>
									<Input type="password" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					{/* Submit Button */}
					<div className="">
						<Button
							className="w-full"
							type="submit"
							disabled={loading}
						>
							{loading ? "Registering..." : "Submit"}
						</Button>
					</div>
					<div className="text-center text-sm">
						Already have an account?{" "}
						<Link href="/" className="underline underline-offset-4">
							Sign in
						</Link>
					</div>
				</form>
			</Form>
		</div>
	);
}
