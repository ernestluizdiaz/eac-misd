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
import { toast } from "sonner";

const formSchema = z.object({
	filer: z.string().min(2, {
		message: "Filer must be at least 2 characters.",
	}),
});
const Filer = () => {
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			filer: "",
		},
	});

	const handleSubmitFiler = async (data: { filer: string }) => {
		const { filer } = data;

		const { error } = await supabase
			.from("filer") // Table name
			.insert([{ name: filer }]); // Insert department name

		if (error) {
			toast.error("Error inserting Filer: " + error.message);
		} else {
			toast.success("Filer added successfully!");
			setTimeout(() => {
				form.reset(); // Reset form after submission
				window.location.reload(); // Reload the page
			}, 1000);
		}
	};

	const [filers, setFilers] = React.useState<
		{ filer_id: number; name: string }[]
	>([]);

	React.useEffect(() => {
		const fetchFilers = async () => {
			const { data, error } = await supabase.from("filer").select("*");
			if (error) {
				toast.error("Error fetching filers: " + error.message);
			} else {
				setFilers(data);
			}
		};

		fetchFilers();
	}, []);

	return (
		<div>
			<div className="pb-6">
				<h2 className="text-2xl font-bold">Filer</h2>
			</div>

			<div className="w-full">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmitFiler)}
						className="space-y-2"
					>
						<FormField
							control={form.control}
							name="filer"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Add Filer:</FormLabel>
									<FormControl>
										<Input
											placeholder="Student"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex justify-end">
							<Button type="submit">Add Filer</Button>
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
								Filer Name
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{filers.map((filer, index) => (
							<tr key={filer.filer_id}>
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
	);
};

export default Filer;
