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
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const Filer = () => {
	const [filers, setFilers] = React.useState<
		{
			filer_id: number;
			name: string;
		}[]
	>([]);
	const [selectedFiler, setSelectedFiler] = React.useState<{
		filer_id: number;
		name: string;
	} | null>(null);
	const [isEditing, setIsEditing] = React.useState(false);

	// Fetch Filers
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

	// ✅ Separate form for adding a filer
	const addForm = useForm({
		resolver: zodResolver(
			z.object({
				filer: z.string().min(2, {
					message: "Filer must be at least 2 characters.",
				}),
			})
		),
		defaultValues: { filer: "" },
	});

	// ✅ Separate form for editing a filer
	const editForm = useForm({
		resolver: zodResolver(
			z.object({
				filerUpdate: z.string().min(2, {
					message: "Filer must be at least 2 characters.",
				}),
			})
		),
		defaultValues: { filerUpdate: "" },
	});

	React.useEffect(() => {
		if (selectedFiler) {
			editForm.reset({ filerUpdate: selectedFiler.name });
		}
	}, [selectedFiler, editForm]);

	// Add Filer
	const handleSubmitFiler = async (data: { filer: string }) => {
		const { error } = await supabase
			.from("filer")
			.insert([{ name: data.filer }]);
		if (error) {
			toast.error("Error inserting Filer: " + error.message);
		} else {
			toast.success("Filer added successfully!");
			setTimeout(() => window.location.reload(), 1000);
		}
	};

	// Edit Filer
	const handleEditFiler = async (data: { filerUpdate: string }) => {
		if (!selectedFiler) return;
		const { error } = await supabase
			.from("filer")
			.update({ name: data.filerUpdate })
			.eq("filer_id", selectedFiler.filer_id);
		if (error) {
			toast.error("Error updating filer: " + error.message);
		} else {
			toast.success("Filer updated successfully!");
			setIsEditing(false);
			setTimeout(() => window.location.reload(), 1000);
		}
	};

	// Delete Filer
	const handleDeleteFiler = async (filerId: number) => {
		const { error } = await supabase
			.from("filer")
			.delete()
			.eq("filer_id", filerId);
		if (error) {
			toast.error("Error deleting filer: " + error.message);
		} else {
			toast.success("Filer deleted successfully!");
			setTimeout(() => window.location.reload(), 1000);
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
		<div>
			<div className="pb-6">
				<h2 className="text-2xl font-bold text-[#7E57C2]">Filer</h2>
			</div>

			{/* ✅ Add Filer Form */}
			<div className="w-full">
				<Form {...addForm}>
					<form
						onSubmit={addForm.handleSubmit(handleSubmitFiler)}
						className="space-y-2"
					>
						<FormField
							control={addForm.control}
							name="filer"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Add Filer:</FormLabel>
									<FormControl>
										<Input
											style={{ borderColor: "#34BFA3" }}
											placeholder="Student"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex justify-end cursor-not-allowed ">
							<Button
								type="submit"
								disabled={!userRoles.includes("Can Add Config")}
								className={`${
									userRoles.includes("Can Add Config")
										? "!bg-[#34BFA3] hover:!bg-[#52ac9a] cursor-pointer "
										: "opacity-50 cursor-not-allowed "
								}`}
							>
								Add Filer
							</Button>
						</div>
					</form>
				</Form>
			</div>

			{/* Table of Filers */}
			<div className="py-6 overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								No.
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
								Filer Name
							</th>
							<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
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
								<td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-3 justify-center">
									{/* ✅ Edit Dialog */}
									<Dialog>
										<DialogTrigger asChild>
											<button
												type="button"
												className={` px-5 py-1 rounded  text-sm font-medium border ${
													userRoles.includes(
														"Can Edit Config"
													)
														? "bg-white text-[#00B0FB] !border-[#00B0FB] hover:bg-[#00B0FB] hover:text-white cursor-pointer"
														: "opacity-50 cursor-not-allowed"
												}`}
												disabled={
													!userRoles.includes(
														"Can Edit Config"
													)
												}
												onClick={() => {
													if (
														userRoles.includes(
															"Can Edit Config"
														)
													) {
														setSelectedFiler(filer);
														setIsEditing(true);
													}
												}}
											>
												Edit
											</button>
										</DialogTrigger>
										<DialogContent>
											<DialogHeader>
												<DialogTitle className="text-[#7E57C2]">
													Edit Filer
												</DialogTitle>
											</DialogHeader>
											<Form {...editForm}>
												<form
													onSubmit={editForm.handleSubmit(
														handleEditFiler
													)}
													className="space-y-4"
												>
													<FormField
														control={
															editForm.control
														}
														name="filerUpdate"
														render={({ field }) => (
															<FormItem>
																<FormLabel>
																	Filer Name
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
														<Button
															type="submit"
															style={{
																backgroundColor:
																	"#34BFA3",
															}}
														>
															Save Changes
														</Button>
													</div>
												</form>
											</Form>
										</DialogContent>
									</Dialog>

									<Dialog>
										<DialogTrigger asChild>
											<button
												type="button"
												className={`px-5 py-1 rounded text-sm font-medium ${
													userRoles.includes(
														"Can Delete Config"
													)
														? "bg-[#DB3A3A] text-white  hover:bg-[#a12c2c] hover:text-white cursor-pointer"
														: "opacity-50 cursor-not-allowed"
												}`}
												disabled={
													!userRoles.includes(
														"Can Delete Config"
													)
												}
											>
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
												Are you sure you want to delete
												this filer?
											</p>
											<div className="flex justify-end space-x-4">
												<DialogClose asChild>
													<Button
														variant="secondary"
														onClick={() =>
															setIsEditing(false)
														}
													>
														Cancel
													</Button>
												</DialogClose>
												<Button
													variant="destructive"
													onClick={() =>
														handleDeleteFiler(
															filer.filer_id
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
	);
};

export default Filer;
