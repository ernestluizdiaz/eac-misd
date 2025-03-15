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
import { supabase } from "@/lib/supabaseClient";
import Filer from "./filer";
import { toast } from "sonner";

const formSchema = z.object({
	department: z.string().min(2, {
		message: "Department must be at least 2 characters.",
	}),
});

const OptionsPage = () => {
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			department: "",
		},
	});

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
				form.reset(); // Reset form after submission
				window.location.reload(); // Reload the page
			}, 1000); // Delay of 1 second
		}
	};

	const [filers, setFilers] = React.useState<{ id: number; name: string }[]>(
		[]
	);

	React.useEffect(() => {
		const fetchDepartment = async () => {
			const { data, error } = await supabase
				.from("department")
				.select("*");
			if (error) {
				toast.error("Error fetching filers: " + error.message);
			} else {
				setFilers(data);
			}
		};

		fetchDepartment();
	}, []);

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
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(
									handleSubmitDepartment
								)}
								className="space-y-2"
							>
								<FormField
									control={form.control}
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
								{filers.map((filer, index) => (
									<tr key={filer.id}>
										<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
											{index + 1}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{filer.name}
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

				{/* Filer  */}
				<div className="w-full lg:w-1/2 border border-black 500 p-5 rounded-lg shadow-xl">
					<Filer />
				</div>
			</div>
		</div>
	);
};

export default OptionsPage;
