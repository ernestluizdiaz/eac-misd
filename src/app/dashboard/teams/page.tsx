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
		{ id: string; email: string; display_name: string; role: string[] }[]
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

		// Check if there's an active session
		const { data: sessionData } = await supabase.auth.getSession();
		const sessionExists = sessionData?.session;

		// Sign up the new user
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
			const newUser = signUpData.user;

			if (newUser) {
				// Insert user into the profiles table
				const { error: profileError } = await supabase
					.from("profiles")
					.insert([
						{
							id: newUser.id, // Use the new user's UUID
							email: newUser.email,
							display_name: displayName,
							role: ["Can View"], // Default role
						},
					]);

				if (profileError) {
					setError(profileError.message);
				} else {
					toast.success("Your account has been created.");

					// If a session exists, log out the newly created user while keeping the current user active
					if (sessionExists) {
						await supabase.auth.signOut(); // Logs out the latest signed-in user

						// Re-authenticate the original session
						await supabase.auth.setSession({
							access_token: sessionExists.access_token,
							refresh_token: sessionExists.refresh_token,
						});
					}

					setTimeout(() => {
						form.reset(); // Reset form after submission
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
				.select("id, display_name, role, email");

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

	const [editMode, setEditMode] = useState<string | null>(null);
	const [selectedRoles, setSelectedRoles] = useState<{
		[key: string]: string[];
	}>({});

	const handleCheckboxChange = (memberId: string, role: string) => {
		if (!editMode || editMode !== memberId) return;

		setSelectedRoles((prev) => {
			const updatedRoles = prev[memberId] || [];

			let newRoles = updatedRoles.includes(role)
				? updatedRoles.filter((r) => r !== role) // Remove if checked off
				: [...updatedRoles, role]; // Add if checked on

			// Always include "Can View"
			if (!newRoles.includes("Can View")) {
				newRoles = ["Can View", ...newRoles];
			}

			return { ...prev, [memberId]: newRoles };
		});
	};

	const handleEdit = (memberId: string, currentRoles: string[]) => {
		setEditMode(memberId);
		setSelectedRoles((prev) => ({
			...prev,
			[memberId]: Array.isArray(currentRoles) ? currentRoles : [],
		}));
	};

	const handleSave = async (memberId: string) => {
		const rolesToSave = selectedRoles[memberId] || [];

		const { error } = await supabase
			.from("profiles")
			.update({ role: rolesToSave }) // Assuming `role` is JSONB
			.eq("id", memberId);

		if (!error) {
			toast.success("Roles updated successfully.");
			setEditMode(null);
			setTimeout(() => {
				window.location.reload();
			}, 1000);
		} else {
			toast.error(error.message);
		}
	};

	const [userRoles, setUserRoles] = React.useState<string[]>([]);

	React.useEffect(() => {
		const fetchUserRoles = async () => {
			const { data: user, error: authError } =
				await supabase.auth.getUser();
			if (authError || !user?.user) return;

			const { data, error } = await supabase
				.from("profiles")
				.select("role")
				.eq("id", user.user.id)
				.maybeSingle();

			if (error) {
				toast.error("Error fetching roles: " + error.message);
				return;
			}

			console.log("Fetched user roles:", data?.role); // Debugging

			// Directly use data.role since it's already an array
			if (data?.role && Array.isArray(data.role)) {
				setUserRoles(data.role);
			} else {
				setUserRoles([]); // Fallback to empty array
			}
		};

		fetchUserRoles();
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
								<div className="cursor-not-allowed">
									<Button
										className={`${
											userRoles.includes("Can Add")
												? "cursor-pointer w-full "
												: "opacity-50 cursor-not-allowed w-full "
										}`}
										type="submit"
										disabled={
											loading ||
											!userRoles.includes("Can Add")
										}
									>
										{loading
											? "Registering..."
											: "Add Account"}
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
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200 ">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										No.
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Member Name
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Email
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Access Roles
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
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{member.email}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											<div className="flex flex-col">
												{[
													"Can Add",
													"Can Edit",
													"Can Delete",
													"Can Assign",
												].map((role) => (
													<div
														key={role}
														className="flex items-center"
													>
														<input
															type="checkbox"
															className="mr-2"
															checked={
																editMode ===
																member.id
																	? selectedRoles[
																			member
																				.id
																	  ]?.includes(
																			role
																	  ) || false
																	: member.role.includes(
																			role
																	  )
															}
															disabled={
																editMode !==
																member.id
															}
															onChange={() =>
																handleCheckboxChange(
																	member.id,
																	role
																)
															}
														/>
														<label>{role}</label>
													</div>
												))}
											</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
											{editMode === member.id ? (
												<button
													className="text-green-600 hover:text-green-900"
													onClick={() =>
														handleSave(member.id)
													}
												>
													Save
												</button>
											) : (
												<>
													<button
														className={`text-indigo-600 ${
															userRoles.includes(
																"Can Edit"
															)
																? "hover:text-indigo-900"
																: "opacity-50 cursor-not-allowed"
														}`}
														disabled={
															!userRoles.includes(
																"Can Edit"
															)
														}
														onClick={() => {
															if (
																userRoles.includes(
																	"Can Edit"
																)
															) {
															}
															handleEdit(
																member.id,
																member.role
															);
														}}
													>
														Edit
													</button>
													<button
														className={`text-red-600 ${
															userRoles.includes(
																"Can Delete"
															)
																? "hover:text-red-900"
																: "opacity-50 cursor-not-allowed"
														}`}
														disabled={
															!userRoles.includes(
																"Can Delete"
															)
														}
													>
														Delete
													</button>
												</>
											)}
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
