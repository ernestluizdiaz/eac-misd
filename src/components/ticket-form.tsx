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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRouter } from "next/navigation"; // Next.js router import
import { getAIResponse } from "@/lib/gemini";

const formSchema = z.object({
	firstName: z.string().min(2, {
		message: "First name must be at least 2 characters.",
	}),
	lastName: z.string().min(2, {
		message: "Last name must be at least 2 characters.",
	}),
	email: z
		.string()
		.email({
			message: "Invalid email address.",
		})
		.regex(/@eac\.edu\.ph$/, {
			message: "Email must be a valid @eac.edu.ph address.",
		}),
	department: z.string().min(1, {
		message: "Department is required.",
	}),
	filer: z.string().min(1, {
		message: "Filer is required.",
	}),
	category: z.string().min(1, {
		message: "Category is required.",
	}),
	description: z.string().min(1, {
		message: "Description is required.",
	}),
});

const TicketForm = () => {
	const [selectedCategory, setSelectedCategory] = useState("");
	const [loading, setLoading] = useState<boolean>(false);
	const router = useRouter();
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			department: "",
			description: "",
			filer: "",
		},
	});

	const [filers, setFilers] = useState<{ filer_id: number; name: string }[]>(
		[]
	);
	useEffect(() => {
		const fetchFilers = async () => {
			const { data, error } = await supabase
				.from("filer")
				.select("filer_id, name");
			if (error) {
				console.error("Error fetching filers:", error.message);
			} else {
				setFilers(
					data.map((filer: { filer_id: number; name: string }) => ({
						filer_id: filer.filer_id,
						name: filer.name,
					}))
				);
			}
		};
		fetchFilers();
	}, []);

	const [departments, setDepartments] = useState<
		{ department_id: number; name: string }[]
	>([]);
	useEffect(() => {
		const fetchDepartments = async () => {
			const { data, error } = await supabase
				.from("department")
				.select("department_id, name");
			if (error) {
				console.error("Error fetching departments:", error.message);
			} else {
				setDepartments(
					data.map(
						(department: {
							department_id: number;
							name: string;
						}) => ({
							department_id: department.department_id,
							name: department.name,
						})
					)
				);
			}
		};

		fetchDepartments();
	}, []);

	const onSubmit = async (data: {
		firstName: string;
		lastName: string;
		email: string;
		department: string;
		filer: string;
		category: string;
		description: string;
	}) => {
		setLoading(true);
		try {
			// Get priority suggestion from AI
			const priority_level = await getAIResponse(
				`Classify the following issue into High, Moderate, or Low priority.
	
				Description: "${data.description}"
				
				Criteria:
				- **High**: Includes words like "system down", "critical", "urgent", "request IT support", "request  assistance"
				- **Moderate**: Includes words like "slow performance", "intermittent connection", "forgot password"
				- **Moderate**: "slow performance", "intermittent connection", "forgot password"
				- **Low**: General inquiries like "questions about schedule", "minor issue, slow internet connection"
	
				Return only "High", "Moderate", or "Low".`
			);

			console.log("AI Suggested Priority:", priority_level);

			// Insert into Supabase with AI-determined priority
			const { data: insertedTicket, error } = await supabase
				.from("tickets")
				.insert([
					{
						first_name: data.firstName,
						last_name: data.lastName,
						email: data.email,
						department_id: data.department, // Ensure this is the ID, not the name
						filer_id: data.filer,
						category: data.category,
						description: data.description,
						status: "Pending",
						priority_level: priority_level.trim(), // Ensure AI response is clean
					},
				])
				.select("ticket_id")
				.single();

			if (error) {
				console.error("Error inserting ticket:", error.message);
				return;
			}

			console.log("Ticket inserted successfully", insertedTicket);

			// Redirect to the results page with ticket ID
			router.push(`/ticket-results?id=${insertedTicket.ticket_id}`);
		} catch (err) {
			console.error("Error analyzing priority:", err);
		}
		setLoading(false);
	};

	return (
		<div className="flex items-center justify-center min-h-screen ">
			<div className="w-lg mx-5 border border-gray-200 p-8 rounded-lg">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-6"
					>
						<div className="flex flex-col md:flex-row gap-4">
							<FormField
								control={form.control}
								name="firstName"
								render={({ field }) => (
									<FormItem className="w-full md:w-1/2">
										<FormLabel>First Name</FormLabel>
										<FormControl>
											<Input
												placeholder="John"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="lastName"
								render={({ field }) => (
									<FormItem className="w-full md:w-1/2">
										<FormLabel>Last Name</FormLabel>
										<FormControl>
											<Input
												placeholder="Doe"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>EAC Email Address</FormLabel>
									<FormControl>
										<Input
											placeholder="john.doe@example.com"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="filer"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										Who is submitting the ticket?
									</FormLabel>
									<FormControl>
										<Select
											value={field.value}
											onValueChange={field.onChange}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select filer" />
											</SelectTrigger>
											<SelectContent>
												{filers.map((filer) => (
													<SelectItem
														key={filer.filer_id}
														value={String(
															filer.filer_id
														)}
													>
														{filer.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="department"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Department</FormLabel>
									<FormControl>
										<Select
											value={field.value}
											onValueChange={field.onChange}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Select department" />
											</SelectTrigger>
											<SelectContent>
												{departments.map(
													(department) => (
														<SelectItem
															key={
																department.department_id
															}
															value={String(
																department.department_id
															)}
														>
															{department.name}
														</SelectItem>
													)
												)}
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="category"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Issue Category</FormLabel>
									<FormControl>
										<RadioGroup
											value={field.value}
											onValueChange={(value) => {
												setSelectedCategory(value);
												field.onChange(
													value === "Other"
														? ""
														: value
												);
											}}
										>
											<div className="flex items-center space-x-2">
												<RadioGroupItem
													value="Connectivity Issues"
													id="connectivity-issues"
													checked={
														field.value ===
														"Connectivity Issues"
													}
												/>
												<Label htmlFor="connectivity-issues">
													Connectivity Issues
												</Label>
											</div>
											<div className="flex items-center space-x-2">
												<RadioGroupItem
													value="Technical Assistance"
													id="technical-assistance"
													checked={
														field.value ===
														"Technical Assistance"
													}
												/>
												<Label htmlFor="technical-assistance">
													Technical Assistance
												</Label>
											</div>
											<div className="flex items-center space-x-2">
												<RadioGroupItem
													value="Event Setup Assistance"
													id="event-setup-assistance"
													checked={
														field.value ===
														"Event Setup Assistance"
													}
												/>
												<Label htmlFor="event-setup-assistance">
													Event Setup Assistance
												</Label>
											</div>
											<div className="flex items-center space-x-2">
												<RadioGroupItem
													value="Other"
													id="other"
													checked={
														selectedCategory ===
														"Other"
													} // Ensure the radio stays selected
												/>
												<Label htmlFor="other">
													Other
												</Label>
											</div>
										</RadioGroup>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Show input field when "Other" is selected */}
						{selectedCategory === "Other" && (
							<FormItem>
								<FormLabel className="underline">
									Specify Other Issue:
								</FormLabel>
								<FormControl>
									<Input
										value={form.watch("category")} // Sync input with form state
										onChange={(e) =>
											form.setValue(
												"category",
												e.target.value
											)
										}
										placeholder="Enter issue category"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											placeholder="A brief description about your issue:"
											className="h-32" // Adjust height as needed
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button
							className="w-full bg-[#34BFA3]"
							type="submit"
							disabled={loading}
						>
							{loading ? "Submitting Ticket..." : "Submit"}
						</Button>
					</form>
				</Form>
			</div>
		</div>
	);
};

export default TicketForm;
