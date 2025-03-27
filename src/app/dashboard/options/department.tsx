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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import Filer from "./filer";
import { toast } from "sonner";

const Department = () => {
	const [department, setDepartment] = React.useState<
		{ department_id: number; name: string }[]
	>([]);
	const [selectedDepartment, setSelectedDepartment] = React.useState<{
		department_id: number;
		name: string;
	} | null>(null);
	const [isEditing, setIsEditing] = React.useState(false);

	// Fetch Department
	React.useEffect(() => {
		const fetchDepartment = async () => {
			const { data, error } = await supabase
				.from("department")
				.select("*");
			if (error) {
				toast.error("Error fetching filers: " + error.message);
			} else {
				setDepartment(data);
			}
		};

		fetchDepartment();
	}, []);

	// ✅ Separate form for adding a department
	const addForm = useForm({
		resolver: zodResolver(
			z.object({
				department: z.string().min(2, {
					message: "Department must be at least 2 characters.",
				}),
			})
		),
		defaultValues: {
			department: "",
		},
	});

	// ✅ Separate form for editing a department
	const editForm = useForm({
		resolver: zodResolver(
			z.object({
				departmentUpdate: z.string().min(2, {
					message: "Department must be at least 2 characters.",
				}),
			})
		),
		defaultValues: {
			departmentUpdate: selectedDepartment?.name || "",
		},
	});

	React.useEffect(() => {
		if (selectedDepartment) {
			editForm.reset({ departmentUpdate: selectedDepartment.name });
		}
	}, [selectedDepartment, editForm]);

	// Add Department
	const handleSubmitDepartment = async (data: { department: string }) => {
		const { department } = data;

		const { error } = await supabase
			.from("department") // Table name
			.insert([{ name: department }]); // Insert department name

		if (error) {
			toast.error("Error inserting department: " + error.message);
		} else {
			toast.success("Department added successfully!");
			setTimeout(() => {
				editForm.reset(); // Reset form after submission
				window.location.reload(); // Reload the page
			}, 1000); // Delay of 1 second
		}
	};

	// Edit Department
	const handleEditDepartment = async (data: { departmentUpdate: string }) => {
		if (!selectedDepartment) return;
		const { departmentUpdate } = data;

		const { error } = await supabase
			.from("department")
			.update({ name: departmentUpdate })
			.eq("department_id", selectedDepartment.department_id); // Update department name

		if (error) {
			toast.error("Error updating department: " + error.message);
		} else {
			toast.success("Department updated successfully!");
			setTimeout(() => {
				editForm.reset(); // Reset form after submission
				window.location.reload(); // Reload the page
			}, 1000); // Delay of 1 second
		}
	};

	// Delete Department
	const handleDeleteDepartment = async (department_id: number) => {
		const { error } = await supabase
			.from("department")
			.delete()
			.eq("department_id", department_id); // Delete department by ID

		if (error) {
			toast.error("Error deleting department: " + error.message);
		} else {
			toast.success("Department deleted successfully!");
			setTimeout(() => window.location.reload(), 1000); // Reload the page
		}
	};

	return (
		<div className="p-6">
			{/* Flex container for responsiveness */}
			<div className="flex flex-col lg:flex-row gap-6">
				{/* Department Container */}
				<div className="w-full lg:w-1/2 border border-black p-5 rounded-lg shadow-xl">
					<div className="pb-6">
						<h2 className="text-2xl font-bold">Department</h2>
					</div>

					<div className="w-full">
						<Form {...addForm}>
							<form
								onSubmit={addForm.handleSubmit(
									handleSubmitDepartment
								)}
								className="space-y-2"
							>
								<FormField
									control={addForm.control}
									name="department"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Add Department:
											</FormLabel>
											<FormControl>
												<Input
													placeholder="BSCS"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="flex justify-end">
									<Button type="submit">
										Add Department
									</Button>
								</div>
							</form>
						</Form>
					</div>

					{/* table */}
					<div className="py-6">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										No.
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Department Name
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{department.map((department, index) => (
									<tr key={department.department_id}>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
											{index + 1}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{department.name}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
											{/* ✅ Edit Dialog */}
											<Dialog>
												<DialogTrigger asChild>
													<button
														className="text-indigo-600 hover:text-indigo-900"
														onClick={() => {
															setSelectedDepartment(
																department
															);
															setIsEditing(true);
														}}
													>
														Edit
													</button>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle>
															Edit Department
														</DialogTitle>
													</DialogHeader>
													<Form {...editForm}>
														<form
															onSubmit={editForm.handleSubmit(
																handleEditDepartment
															)}
															className="space-y-4"
														>
															<FormField
																control={
																	editForm.control
																}
																name="departmentUpdate"
																render={({
																	field,
																}) => (
																	<FormItem>
																		<FormLabel>
																			Department
																			Name
																		</FormLabel>
																		<FormControl>
																			<Input
																				{...field}
																			/>
																		</FormControl>
																		<FormMessage />
																	</FormItem>
																)}
															/>
															<div className="flex justify-end">
																<Button type="submit">
																	Save Changes
																</Button>
															</div>
														</form>
													</Form>
												</DialogContent>
											</Dialog>

											<Dialog>
												<DialogTrigger asChild>
													<button className="text-red-600 hover:text-red-900 ml-4">
														Delete
													</button>
												</DialogTrigger>
												<DialogContent>
													<DialogHeader>
														<DialogTitle>
															Confirm Deletion
														</DialogTitle>
													</DialogHeader>
													<p>
														Are you sure you want to
														delete this department?
													</p>
													<div className="flex justify-end space-x-4">
														<Button variant="secondary">
															Cancel
														</Button>
														<Button
															variant="destructive"
															onClick={() =>
																handleDeleteDepartment(
																	department.department_id
																)
															}
														>
															Delete
														</Button>
													</div>
												</DialogContent>
											</Dialog>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* Filer  */}
				<div className="w-full lg:w-1/2 border border-black 500 p-5 rounded-lg shadow-xl">
					<Filer />
				</div>
			</div>
		</div>
	);
};

export default Department;
