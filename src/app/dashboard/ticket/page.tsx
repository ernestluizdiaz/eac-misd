/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Search } from "lucide-react";

const SearchIcon = () => {
	return <Search width={20} height={20} />;
};

const TicketPage = () => {
	const [sortOption, setSortOption] = useState("ID");
	const [tickets, setTickets] = useState<any[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
	};

	const fetchTickets = async () => {
		const { data, error } = await supabase.from("tickets").select(`
				ticket_id, first_name, last_name, email, category, description, priority_level, assign_to, status,
				department:department_id (name),
				filer:filer_id (name)
			`);

		if (error) {
			console.error("Error fetching tickets:", error);
			return null;
		}

		return data;
	};

	useEffect(() => {
		const getTickets = async () => {
			const data = await fetchTickets();
			if (data) setTickets(data);
		};

		getTickets();
	}, []);

	const fetchProfiles = async () => {
		const { data, error } = await supabase
			.from("profiles")
			.select(`id, display_name, role`);
		if (error) {
			console.error("Error fetching profiles:", error);
			return null;
		}

		setProfiles(data);
		return data;
	};

	// Fetch profiles when component mounts
	useEffect(() => {
		fetchProfiles();
	}, []);

	const [editMode, setEditMode] = useState<{ [key: number]: boolean }>({});
	const [selectedPriorities, setSelectedPriorities] = useState<{
		[key: number]: string;
	}>({});
	const [profiles, setProfiles] = useState<
		{ id: string; display_name: string }[]
	>([]);
	const [selectedAssignees, setSelectedAssignees] = useState<{
		[key: number]: string;
	}>({});
	const [selectedStatus, setSelectedStatus] = useState<{
		[key: number]: string;
	}>({});

	// Toggle Edit Mode
	const handleEdit = (ticketId: number) => {
		setEditMode((prev) => ({ ...prev, [ticketId]: !prev[ticketId] }));
	};

	// Handle Priority Selection
	const handlePriorityChange = (ticketId: number, value: string) => {
		setSelectedPriorities((prev) => ({ ...prev, [ticketId]: value }));
	};

	// Handle Status Selection
	const handleStatusChange = (ticketId: number, value: string) => {
		setSelectedStatus((prev) => ({ ...prev, [ticketId]: value }));
	};

	const handleAssignChange = (ticketId: number, profileId: string) => {
		setSelectedAssignees((prev) => ({ ...prev, [ticketId]: profileId }));
	};

	// Update Priority Level in Supabase
	const updatePriority = async (ticketId: number) => {
		const newPriority = selectedPriorities[ticketId] || ""; // Default to empty string if not selected
		if (!newPriority) return; // Prevent unnecessary update

		const { error } = await supabase
			.from("tickets")
			.update({ priority_level: newPriority })
			.eq("ticket_id", ticketId);

		if (error) {
			console.error("Error updating priority:", error);
			toast.error("Failed to update priority.");
			return;
		}

		// Show success notification
		toast.success("Priority level updated successfully!");

		// Reload the page after saving
		setTimeout(() => {
			window.location.reload();
		}, 1000);
	};

	const updateAssignedTo = async (ticketId: number) => {
		const assignToId = selectedAssignees[ticketId]; // Get selected profile ID
		if (!assignToId) return; // Prevent unnecessary update

		const { error } = await supabase
			.from("tickets")
			.update({ assign_to: assignToId }) // Save UUID
			.eq("ticket_id", ticketId);

		if (error) {
			console.error("Error updating assigned user:", error);
			toast.error("Failed to update assignment.");
			return;
		}

		toast.success("Assignee updated successfully!");

		// Reload the page after saving
		setTimeout(() => {
			window.location.reload();
		}, 1000);
	};

	const updateStatus = async (ticketId: number) => {
		const status = selectedStatus[ticketId]; // Get selected status
		if (!status) return; // Prevent unnecessary update

		const { error } = await supabase
			.from("tickets")
			.update({ status }) // Save UUID
			.eq("ticket_id", ticketId);

		if (error) {
			console.error("Error updating status:", error);
			toast.error("Failed to update status.");
			return;
		}

		toast.success("Status updated successfully!");

		// Reload the page after saving
		setTimeout(() => {
			window.location.reload();
		}, 1000);
	};

	const filteredAndSortedTickets = [...tickets]
		.filter((ticket) => {
			const searchLower = searchTerm.toLowerCase();

			return (
				ticket.ticket_id.toString().includes(searchLower) ||
				ticket.first_name.toLowerCase().includes(searchLower) ||
				ticket.last_name.toLowerCase().includes(searchLower) ||
				ticket.email.toLowerCase().includes(searchLower) ||
				(ticket.filer?.name || "")
					.toLowerCase()
					.includes(searchLower) || // Submit By
				(ticket.department?.name || "")
					.toLowerCase()
					.includes(searchLower) || // Department
				ticket.category.toLowerCase().includes(searchLower) ||
				(ticket.priority_level || "")
					.toLowerCase()
					.includes(searchLower) ||
				(
					profiles.find(
						(p) => String(p.id) === String(ticket.assign_to)
					)?.display_name || ""
				)
					.toLowerCase()
					.includes(searchLower) // Assigned To
			);
		})
		.sort((a, b) => {
			if (sortOption === "ID") {
				return a.ticket_id - b.ticket_id;
			} else if (sortOption === "Name") {
				return a.first_name.localeCompare(b.first_name);
			} else if (sortOption === "Email") {
				return a.email.localeCompare(b.email);
			} else if (sortOption === "Submit By") {
				return (a.filer?.name || "").localeCompare(b.filer?.name || "");
			} else if (sortOption === "Department") {
				return (a.department?.name || "").localeCompare(
					b.department?.name || ""
				);
			} else if (sortOption === "Issue Category") {
				return a.category.localeCompare(b.category);
			} else if (sortOption === "Priority Level") {
				const priorityOrder: Record<
					"High" | "Moderate" | "Low",
					number
				> = {
					High: 1,
					Moderate: 2,
					Low: 3,
				};
				return (
					(priorityOrder[
						a.priority_level as keyof typeof priorityOrder
					] || 4) -
					(priorityOrder[
						b.priority_level as keyof typeof priorityOrder
					] || 4)
				);
			}
			return 0;
		});

	return (
		<div>
			<div>
				<div className="flex justify-between mb-6 gap-2">
					<div className="relative w-xs">
						<input
							type="text"
							value={searchTerm}
							onChange={handleSearchChange}
							className="border p-2 pl-10 rounded-lg text-sm shadow-sm w-full"
						/>
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none w-auto h-auto">
							<SearchIcon />
						</div>
					</div>
					<Select
						value={sortOption}
						onValueChange={(value) => setSortOption(value)}
					>
						<SelectTrigger className="w-xs">
							<SelectValue placeholder="Sort by" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ID">ID</SelectItem>
							<SelectItem value="Name">Name</SelectItem>
							<SelectItem value="Email">Email</SelectItem>
							<SelectItem value="Submit By">Submit By</SelectItem>
							<SelectItem value="Department">
								Department
							</SelectItem>
							<SelectItem value="Issue Category">
								Issue Category
							</SelectItem>
							<SelectItem value="Priority Level">
								Priority Level
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div>
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
										ID
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
										Name
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
										Email Address
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
										Submit By
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
										Department
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
										Issue Category
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
										Description
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
										Status
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
										Priority Level
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
										Assign To
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{filteredAndSortedTickets.map((ticket) => (
									<tr
										key={ticket.ticket_id}
										className="hover:bg-gray-100"
									>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{ticket.ticket_id}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{ticket.first_name}{" "}
											{ticket.last_name}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{ticket.email}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{ticket.filer?.name || "N/A"}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{ticket.department?.name || "N/A"}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{ticket.category}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{ticket.description}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{editMode[ticket.ticket_id] ? (
												<Select
													value={
														selectedStatus[
															ticket.ticket_id
														] ||
														ticket.status ||
														"Pending"
													}
													onValueChange={(value) =>
														handleStatusChange(
															ticket.ticket_id,
															value
														)
													}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select Status" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="Pending">
															Pending
														</SelectItem>
														<SelectItem value="In Progress">
															In Progress
														</SelectItem>
														<SelectItem value="Resolved">
															Resolved
														</SelectItem>
													</SelectContent>
												</Select>
											) : (
												ticket.status || "Pending"
											)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{editMode[ticket.ticket_id] ? (
												<Select
													value={
														selectedPriorities[
															ticket.ticket_id
														] ||
														ticket.priority_level ||
														""
													}
													onValueChange={(value) =>
														handlePriorityChange(
															ticket.ticket_id,
															value
														)
													}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select Priority Level" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="High">
															High
														</SelectItem>
														<SelectItem value="Moderate">
															Moderate
														</SelectItem>
														<SelectItem value="Low">
															Low
														</SelectItem>
													</SelectContent>
												</Select>
											) : (
												<span>
													{ticket.priority_level ||
														"Not Set"}
												</span>
											)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{editMode[ticket.ticket_id] ? (
												<Select
													value={
														selectedAssignees[
															ticket.ticket_id
														] ||
														ticket.assign_to ||
														""
													}
													onValueChange={(value) =>
														handleAssignChange(
															ticket.ticket_id,
															value
														)
													}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Select Assignee" />
													</SelectTrigger>
													<SelectContent>
														{profiles.map(
															(profile) => (
																<SelectItem
																	key={
																		profile.id
																	}
																	value={
																		profile.id
																	}
																>
																	{
																		profile.display_name
																	}
																</SelectItem>
															)
														)}
													</SelectContent>
												</Select>
											) : (
												<span>
													{profiles.find(
														(p) =>
															String(p.id) ===
															String(
																ticket.assign_to
															)
													)?.display_name ||
														"Unassigned"}
												</span>
											)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex gap-2">
											{editMode[ticket.ticket_id] ? (
												<>
													<div className="flex flex-col items-center justify-center">
														<button
															className="cursor-pointer font-semibold text-black hover:text-green-900"
															onClick={async () => {
																await Promise.all(
																	[
																		updatePriority(
																			ticket.ticket_id
																		),
																		updateAssignedTo(
																			ticket.ticket_id
																		),
																		updateStatus(
																			ticket.ticket_id
																		),
																	]
																);
																handleEdit(
																	ticket.ticket_id
																); // Exit edit mode after saving
															}}
														>
															Save
														</button>
														<button
															className="cursor-pointer font-semibold text-red-600 hover:text-red-900"
															onClick={() =>
																handleEdit(
																	ticket.ticket_id
																)
															} // Just exits edit mode
														>
															Cancel
														</button>
													</div>
												</>
											) : (
												<button
													className="cursor-pointer font-semibold text-indigo-600 hover:text-indigo-900"
													onClick={() =>
														handleEdit(
															ticket.ticket_id
														)
													}
												>
													Edit
												</button>
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

export default TicketPage;
