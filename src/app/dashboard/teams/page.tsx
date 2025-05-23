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
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const formSchema = z
	.object({
		displayName: z.string().min(2, {
			message: "Display name must be at least 2 characters.",
		}),
		email: z
			.string()
			.email({
				message: "Invalid email address.",
			})
			.superRefine(async (email, ctx) => {
				const { data: existingUser, error } = await supabase
					.from("profiles") // Change to "auth.users" if checking auth table
					.select("email")
					.eq("email", email)
					.maybeSingle();

				if (existingUser) {
					ctx.addIssue({
						code: "custom",
						message: "This email is already registered.",
					});
				}
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

			// Directly use data.role since it's already an array
			if (data?.role && Array.isArray(data.role)) {
				setUserRoles(data.role);
			} else {
				setUserRoles([]); // Fallback to empty array
			}
		};

		fetchUserRoles();
	}, []);

	const handleDelete = async (memberId: string) => {
		if (!userRoles.includes("Can Delete")) {
			toast.error("You do not have permission to delete users.");
			return;
		}

		try {
			// 1. Unassign tickets first
			const { error: updateError } = await supabase
				.from("tickets")
				.update({ assign_to: null })
				.eq("assign_to", memberId);

			if (updateError) {
				toast.error("Failed to update tickets: " + updateError.message);
				return;
			}

			// 2. Delete from profiles table
			const { error: userError } = await supabase
				.from("profiles")
				.delete()
				.eq("id", memberId);

			if (userError) {
				toast.error("Failed to delete user: " + userError.message);
				return;
			}

			// 3. Call your API endpoint to delete from Auth
			const response = await fetch("/api/delete-user", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ userId: memberId }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				toast.error(
					"Failed to delete user authentication: " +
						(errorData.message || "Unknown error")
				);
				return;
			}

			// Success
			toast.success("User deleted successfully.");
			setTeamMembers((prev) =>
				prev.filter((member) => member.id !== memberId)
			);
		} catch (error) {
			toast.error("An unexpected error occurred during deletion.");
			console.error(error);
		}
	};

	return (
		<div className="p-6">
			{/* Flex container for responsiveness */}
			<div className="flex flex-col gap-6">
				{/* Add Teams Container */}
				<div className="w-full border border-black p-5 rounded-lg shadow-xl">
					<div className="pb-6">
						<h2 className="text-2xl font-bold">Create account</h2>
					</div>

					<div className="w-full flex flex-row justify-center">
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-5 w-full"
							>
								<div className="flex flex-row gap-6">
									{/* Display Name Field */}
									<FormField
										control={form.control}
										name="displayName"
										render={({ field }) => (
											<FormItem className="flex-1">
												<FormLabel>
													Display Name
												</FormLabel>
												<FormControl>
													<Input
														{...field}
														className="w-full"
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
											<FormItem className="flex-1">
												<FormLabel>Password</FormLabel>
												<FormControl>
													<Input
														type="password"
														{...field}
														className="w-full"
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div className="flex flex-row gap-6">
									{/* Email Field */}
									<FormField
										control={form.control}
										name="email"
										render={({ field }) => (
											<FormItem className="flex-1">
												<FormLabel>Email</FormLabel>
												<FormControl>
													<Input
														type="email"
														{...field}
														className="w-full"
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
											<FormItem className="flex-1">
												<FormLabel>
													Confirm Password
												</FormLabel>
												<FormControl>
													<Input
														type="password"
														{...field}
														className="w-full"
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div className="flex justify-center">
									{/* Submit Button */}
									<div className="cursor-not-allowed w-full overflow-auto">
										<Button
											className={`${
												userRoles.includes(
													"Can Add Teams"
												)
													? "cursor-pointer w-full px-40 bg-[#34BFA3] "
													: "opacity-50 cursor-not-allowed w-full "
											}`}
											type="submit"
											disabled={
												loading ||
												!userRoles.includes(
													"Can Add Teams"
												)
											}
										>
											{loading
												? "Registering..."
												: "Add Account"}
										</Button>
									</div>
								</div>
							</form>
						</Form>
					</div>
				</div>

				{/* Filer Container */}
				<div className="w-full border border-black 500 p-5 rounded-lg shadow-xl">
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
													"Can Add Config",
													"Can Edit Config",
													"Can Delete Config",
													"Can Add Teams",
													"Can Edit Teams",
													"Can Delete Teams",
													"Can Edit Priority",
													"Can Edit Status",
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
										<td className="  whitespace-nowrap text-sm font-medium space-x-2">
											<div className=" flex flex-col items-center space-y-2">
												{editMode === member.id ? (
													<button
														className="text-white bg-[#34BFA3] py-1 px-6 rounded-sm hover:text-green-900"
														onClick={() =>
															handleSave(
																member.id
															)
														}
													>
														Save
													</button>
												) : (
													<>
														<button
															className={`text-blue-400 rounded-sm border-blue-400 border-2 py-1 px-8 ${
																userRoles.includes(
																	"Can Edit Teams"
																)
																	? "hover:text-indigo-900"
																	: "opacity-50 cursor-not-allowed"
															}`}
															disabled={
																!userRoles.includes(
																	"Can Edit Teams"
																)
															}
															onClick={() => {
																if (
																	userRoles.includes(
																		"Can Edit Teams"
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
														<Dialog>
															<DialogTrigger
																asChild
															>
																<button
																	className={`text-white bg-red-600 py-1 px-6 rounded-sm ${
																		userRoles.includes(
																			"Can Delete Teams"
																		)
																			? "hover:text-red-900"
																			: "opacity-50 cursor-not-allowed"
																	}`}
																	disabled={
																		!userRoles.includes(
																			"Can Delete Teams"
																		)
																	}
																>
																	Delete
																</button>
															</DialogTrigger>

															<DialogContent>
																<DialogHeader>
																	<DialogTitle>
																		Confirm
																		Deletion
																	</DialogTitle>
																</DialogHeader>
																<p>
																	Are you sure
																	you want to
																	delete this
																	member?
																</p>
																<div className="flex justify-end space-x-4">
																	<DialogClose
																		asChild
																	>
																		<Button variant="secondary">
																			Cancel
																		</Button>
																	</DialogClose>
																	<Button
																		variant="destructive"
																		onClick={() =>
																			handleDelete(
																				member.id
																			)
																		} // Keep the same delete function here
																	>
																		Delete
																	</Button>
																</div>
															</DialogContent>
														</Dialog>
													</>
												)}
											</div>
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
