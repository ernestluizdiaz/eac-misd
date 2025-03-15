"use client";
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

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
const TeamsPage = () => {
	const [teamMembers, setTeamMembers] = useState<
		{ id: string; display_name: string; role: string }[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

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

	const onSubmit = async (data: {
		email: string;
		password: string;
		displayName: string;
	}) => {
		setLoading(true);
		setError(null);

		const { email, password, displayName } = data;

		// Sign up the user
		const { data: signUpData, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					displayName, // Store display name in user metadata
				},
			},
		});

		if (error) {
			setError(error.message);
		} else {
			const user = signUpData.user;

			if (user) {
				// Add user to the profiles table with default role "Can View"
				const { error: profileError } = await supabase
					.from("profiles")
					.insert([
						{
							id: user.id, // Use the user's UUID
							display_name: displayName,
							role: "Can View", // Default role
						},
					]);

				if (profileError) {
					setError(profileError.message);
				} else {
					toast.success("Your account has been created.");
					setTimeout(() => {
						form.reset(); // Reset form after submission
						window.location.reload(); // Reload the page
					}, 2000);
				}
			}
		}

		setLoading(false);
	};

	useEffect(() => {
		const fetchTeamMembers = async () => {
			const { data, error } = await supabase
				.from("profiles")
				.select("id, display_name, role");

			if (error) {
				setError(error.message);
			} else {
				setTeamMembers(data);
				console.log(data);
			}

			setLoading(false);
		};

		fetchTeamMembers();
	}, []);
	return (
		<div className="p-6">
			{/* Flex container for responsiveness */}
			<div className="flex flex-col lg:flex-row gap-6">
				{/* Add Teams Container */}
				<div className="w-full lg:w-1/2 border border-black p-5 rounded-lg shadow-xl">
					<div className="pb-6">
						<h2 className="text-2xl font-bold">Create account</h2>
					</div>

					<div className="w-full">
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
												<Input
													type="email"
													{...field}
												/>
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
												<Input
													type="password"
													{...field}
												/>
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
											<FormLabel>
												Confirm Password
											</FormLabel>
											<FormControl>
												<Input
													type="password"
													{...field}
												/>
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
							</form>
						</Form>
					</div>
				</div>

				{/* Filer Container */}
				<div className="w-full lg:w-1/2 border border-black 500 p-5 rounded-lg shadow-xl">
					<div className="pb-6">
						<h2 className="text-2xl font-bold">
							Team Members Access
						</h2>
					</div>

					{/* table */}
					<div className="">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										No.
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Member Name
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Role
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{teamMembers.map((member, index) => (
									<tr key={member.id}>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
											{index + 1}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{member.display_name}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<div className="flex flex-col">
												<label className="flex items-center text-sm text-gray-600">
													<input
														type="checkbox"
														checked={member.role.includes(
															"Can View"
														)}
														readOnly
														className="form-checkbox h-4 w-4 text-indigo-600"
													/>
													<span className="ml-2">
														Can View
													</span>
												</label>
												<label className="flex items-center text-sm text-gray-600">
													<input
														type="checkbox"
														checked={member.role.includes(
															"Can Edit"
														)}
														readOnly
														className="form-checkbox h-4 w-4 text-indigo-600"
													/>
													<span className="ml-2">
														Can Edit
													</span>
												</label>
												<label className="flex items-center text-sm text-gray-600">
													<input
														type="checkbox"
														checked={member.role.includes(
															"Can Approve"
														)}
														readOnly
														className="form-checkbox h-4 w-4 text-indigo-600"
													/>
													<span className="ml-2">
														Can Approve
													</span>
												</label>
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											<button className="text-indigo-600 hover:text-indigo-900">
												Edit
											</button>
											<button className="text-red-600 hover:text-red-900 ml-4">
												Delete
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TeamsPage;
