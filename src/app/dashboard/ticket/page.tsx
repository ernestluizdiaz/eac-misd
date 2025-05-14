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
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { handlePdfDownload } from "@/app/dashboard/pdf";
interface Department {
	name: string;
}

interface Filer {
	name: string;
}

interface Ticket {
	ticket_id: number;
	first_name: string;
	last_name: string;
	email: string;
	category: string;
	description: string;
	priority_level: string;
	assign_to: string;
	status: string;
	department?: Department; // Optional in case it's null
	filer?: Filer; // Optional in case it's null
}

const SearchIcon = () => {
	return <Search width={20} height={20} />;
};

const TicketPage = () => {
	const [sortOption, setSortOption] = useState("");
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

	const [priorityMode, setPriorityMode] = useState<{
		[key: number]: boolean;
	}>({});
	const [statusMode, setStatusMode] = useState<{ [key: number]: boolean }>(
		{}
	);
	const [assignMode, setAssignMode] = useState<{ [key: number]: boolean }>(
		{}
	);

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

	const [resolutionProof, setResolutionProof] = useState<{
		[key: number]: string;
	}>({});
	const [isProofDialogOpen, setIsProofDialogOpen] = useState(false);
	const [currentTicketId, setCurrentTicketId] = useState<number | null>(null);

	// Toggle Edit Mode
	const handlePriority = (ticketId: number) => {
		setPriorityMode((prev) => ({ ...prev, [ticketId]: !prev[ticketId] }));
	};

	const handleStatus = (ticketId: number) => {
		setStatusMode((prev) => ({ ...prev, [ticketId]: !prev[ticketId] }));
	};

	const handleAssign = (ticketId: number) => {
		setAssignMode((prev) => ({ ...prev, [ticketId]: !prev[ticketId] }));
	};

	// Handle Priority Selection
	const handlePriorityChange = (ticketId: number, value: string) => {
		setSelectedPriorities((prev) => ({ ...prev, [ticketId]: value }));
	};

	// Handle Status Selection
	const handleStatusChange = (ticketId: number, value: string) => {
		if (value === "Resolved") {
			setCurrentTicketId(ticketId);
			setIsProofDialogOpen(true);
		} else {
			// Only update the local state, do not call updateStatus yet
			setSelectedStatus((prev) => ({ ...prev, [ticketId]: value }));
		}
	};
	const handleProofSubmit = async () => {
		if (currentTicketId !== null && resolutionProof[currentTicketId]) {
			const ticketId = currentTicketId;

			// Save status + proof immediately
			await updateStatus(ticketId, "Resolved", resolutionProof[ticketId]);

			// Update local state
			setSelectedStatus((prev) => ({
				...prev,
				[ticketId]: "Resolved",
			}));

			setIsProofDialogOpen(false);
			handleStatus(ticketId); // exit edit mode
		}
	};

	const handleProofCancel = () => {
		// Reset to previous status if user cancels
		setIsProofDialogOpen(false);
	};

	// Handle Resolution Proof
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

		// Fetch assignee's email from the profiles table
		const { data: assignee, error: assigneeError } = await supabase
			.from("profiles")
			.select("display_name, email")
			.eq("id", assignToId)
			.single();

		if (assigneeError || !assignee) {
			console.error("Error fetching assignee:", assigneeError);
			toast.error("Failed to fetch assignee details.");
			return;
		}

		// Fetch the ticket details to include in the email
		const { data: ticket, error: ticketError } = await supabase
			.from("tickets")
			.select(
				`
				ticket_id, first_name, last_name, email, category, description, priority_level, assign_to, status,
				department:department_id (name),
				filer:filer_id (name)
			`
			)
			.eq("ticket_id", ticketId)
			.single<Ticket>();

		if (ticketError || !ticket) {
			console.error("Error fetching ticket:", ticketError);
			toast.error("Failed to fetch ticket details.");
			return;
		}

		// Update the ticket assignment in Supabase
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

		// Prepare the email content
		const emailHTML = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
				<h2 style="color: #007bff;">You have been assigned a new support ticket</h2>
				<p>Hello ${assignee.display_name},</p>
				<p>You have been assigned to a new support ticket. Please find the details below:</p>
	
				<table style="width: 100%; border-collapse: collapse;">
					<tr>
						<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Ticket No.</td>
						<td style="padding: 8px; border: 1px solid #ddd;">${ticket.ticket_id}</td>
					</tr>
					<tr>
						<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Name</td>
						<td style="padding: 8px; border: 1px solid #ddd;">${ticket.first_name} ${
			ticket.last_name
		}</td>
					</tr>
					<tr>
						<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Category</td>
						<td style="padding: 8px; border: 1px solid #ddd;">${ticket.category}</td>
					</tr>
					<tr>
						<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Description</td>
						<td style="padding: 8px; border: 1px solid #ddd;">${ticket.description}</td>
					</tr>
					<tr>
						<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Department</td>
						<td style="padding: 8px; border: 1px solid #ddd;">${
							ticket.department?.name
						}</td>
								
					</tr>
					<tr>
						<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Submitter</td>
						<td style="padding: 8px; border: 1px solid #ddd;">${ticket.filer?.name}</td>
					</tr>
					<tr>
						<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Priority Level</td>
						<td style="padding: 8px; border: 1px solid #ddd; color: ${
							ticket.priority_level === "High"
								? "red"
								: ticket.priority_level === "Moderate"
								? "orange"
								: ticket.priority_level === "Low"
								? "#BA8E23"
								: "black"
						}; font-weight: bold;">${ticket.priority_level}</td>
					</tr>
					<tr>
						<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Status</td>
						<td style="padding: 8px; border: 1px solid #ddd; color: ${
							ticket.status === "Resolved"
								? "green"
								: ticket.status === "In Progress"
								? "orange"
								: ticket.status === "Pending"
								? "#BA8E23"
								: "black"
						}; font-weight: bold;">${ticket.status}</td>
					</tr>
				</table>
	
				<p style="margin-top: 20px;">Thank you,<br><strong>Support Team</strong></p>
			</div>
		`;

		// Send email notification to the assignee
		await fetch("/api/send-email", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				to: assignee.email,
				subject: `New Ticket Assigned: #${ticket.ticket_id}`,
				html: emailHTML, // Sending HTML email
			}),
		});

		// Reload the page after saving
		setTimeout(() => {
			window.location.reload();
		}, 1000);
	};

	const updateStatus = async (
		ticketId: number,
		status: string,
		proof?: string
	) => {
		if (!status) return; // Prevent unnecessary update

		const now = new Date().toISOString();
		const updateData: any = { status };

		// If status is Resolved, add proof and resolved_at timestamp
		if (status === "Resolved" && proof) {
			updateData.proof = proof;
			updateData.resolved_at = now;
		}

		// Fetch the ticket details to get the user's email
		const { data: ticket, error: fetchError } = await supabase
			.from("tickets")
			.select(
				"ticket_id, first_name, last_name, email, category, description, priority_level, status, created_at, resolved_at, proof"
			)
			.eq("ticket_id", ticketId)
			.single();

		if (fetchError) {
			console.error("Error fetching ticket:", fetchError);
			toast.error("Failed to fetch ticket details.");
			return;
		}

		// Update the ticket in Supabase
		const { error } = await supabase
			.from("tickets")
			.update(updateData)
			.eq("ticket_id", ticketId);

		if (error) {
			console.error("Error updating status:", error);
			toast.error("Failed to update status.");
			return;
		}

		toast.success("Status updated successfully!");

		if (status === "In Progress" || status === "Resolved") {
			// Create email content
			let emailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #007bff;">Support Ticket Status Updated</h2>
          <p>Hello ${ticket.first_name},</p>
          <p>Your support ticket status has been updated. Please find the details below:</p>

          <table style="width: 100%; border-collapse: collapse;">
						<tr>
							<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Ticket No.</td>
							<td style="padding: 8px; border: 1px solid #ddd;">${ticket.ticket_id}</td>
						</tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Name</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${
					ticket.first_name
				} ${ticket.last_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Category</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${
					ticket.category
				}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Description</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${
					ticket.description
				}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Priority Level</td>
              <td style="padding: 8px; border: 1px solid #ddd; color: ${
					ticket.priority_level === "High"
						? "red"
						: ticket.priority_level === "Moderate"
						? "orange"
						: ticket.priority_level === "Low"
						? "#BA8E23"
						: "black"
				}; font-weight: bold;">${ticket.priority_level}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Status</td>
              <td style="padding: 8px; border: 1px solid #ddd; color: ${
					status === "Resolved" ? "green" : "orange"
				}; font-weight: bold;">${status}</td>
            </tr>
						<tr>
							<td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Created At</td>
							<td style="padding: 8px; border: 1px solid #ddd;">${new Date(
								ticket.created_at
							).toLocaleString()}</td>
						</tr>
      `;

			// Add resolution details if status is Resolved
			if (status === "Resolved") {
				const resolvedDate = new Date(
					updateData.resolved_at
				).toLocaleString();
				emailHTML += `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Resolution Details</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${updateData.proof}</td>
            </tr>
						 <tr>
              <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Resolved At</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${resolvedDate}</td>
            </tr>
        `;
			}

			// Close the table and complete the email
			emailHTML += `
          </table>

          <p style="margin-top: 20px;">Thank you,<br><strong>Support Team</strong></p>
        </div>
      `;

			await fetch("/api/send-email", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					to: ticket.email,
					subject: `Ticket Status Updated: ${status}`,
					html: emailHTML,
				}),
			});
		}

		// Reload the page after saving
		setTimeout(() => {
			window.location.reload();
		}, 1000);
	};

	const [currentPage, setCurrentPage] = useState(1);

	const filteredAndSortedTickets = [...tickets]
		.filter((ticket) => {
			const searchLower = searchTerm.toLowerCase();

			const matchesSearch =
				String(ticket.ticket_id)
					.padStart(3, "0")
					.includes(searchLower) ||
				ticket.first_name.toLowerCase().includes(searchLower) ||
				ticket.last_name.toLowerCase().includes(searchLower) ||
				ticket.email.toLowerCase().includes(searchLower) ||
				(ticket.filer?.name || "")
					.toLowerCase()
					.includes(searchLower) ||
				(ticket.department?.name || "")
					.toLowerCase()
					.includes(searchLower) ||
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
					.includes(searchLower) ||
				(ticket.status ?? "").toLowerCase().includes(searchLower);

			if (["Pending", "In Progress", "Resolved"].includes(sortOption)) {
				return matchesSearch && ticket.status === sortOption;
			}

			return matchesSearch;
		})
		.sort((a, b) => {
			return a.ticket_id - b.ticket_id;
		});

	// Fetch user roles from
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
							<SelectItem value="Pending">Pending</SelectItem>
							<SelectItem value="In Progress">
								In Progress
							</SelectItem>
							<SelectItem value="Resolved">Resolved</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div>
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-[#F2F2F2]">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
										Ticket No.
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
										Name
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
										Email Address
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
										Role
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
								{filteredAndSortedTickets.length === 0 ? (
									<tr>
										<td
											colSpan={11}
											className="text-center py-6 text-gray-500"
										>
											No tickets yet
										</td>
									</tr>
								) : (
									// Show tickets if available
									filteredAndSortedTickets
										.reverse()
										.slice(
											(currentPage - 1) * 10,
											currentPage * 10
										)
										.map((ticket: any) => (
											<tr
												key={ticket.ticket_id}
												className="hover:bg-gray-100"
											>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-black">
													{ticket.ticket_id
														.toString()
														.padStart(3, "0")}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-black">
													{ticket.first_name}{" "}
													{ticket.last_name}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-black">
													{ticket.email}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-black">
													{ticket.filer?.name ||
														"N/A"}
												</td>
												<td className="px-6 py-4 text-sm text-black">
													{ticket.department?.name ||
														"N/A"}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-black">
													{ticket.category}
												</td>
												<td className="px-6 py-4 text-sm text-black">
													{ticket.description}
												</td>

												<td className="px-6 py-4 whitespace-nowrap text-sm text-black">
													{statusMode[
														ticket.ticket_id
													] ? (
														<Select
															value={
																selectedStatus[
																	ticket
																		.ticket_id
																] ||
																ticket.status ||
																"Pending"
															}
															onValueChange={(
																value
															) =>
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
														<span
															className={`font-semibold text-sm px-4 py-1 rounded-full
																${
																	ticket.status ===
																	"Pending"
																		? "text-yellow-600 bg-yellow-100"
																		: ticket.status ===
																		  "Resolved"
																		? "text-green-600 bg-green-100"
																		: ticket.status ===
																		  "In Progress"
																		? "text-blue-600 bg-blue-100"
																		: "text-gray-600 bg-gray-100"
																}
															`}
														>
															{ticket.status ||
																"Pending"}
														</span>
													)}
												</td>

												{/* Resolution Proof RequiredDialog */}
												<Dialog
													open={isProofDialogOpen}
													onOpenChange={
														setIsProofDialogOpen
													}
												>
													<DialogContent>
														<DialogHeader>
															<DialogTitle>
																Resolution Proof
																Required
															</DialogTitle>
															<DialogDescription>
																Please provide
																proof of
																resolution for
																this ticket.
																This information
																will be shared
																with the
																customer.
															</DialogDescription>
														</DialogHeader>

														<div className="py-4">
															<Textarea
																placeholder="Enter detailed resolution proof here..."
																className="min-h-[150px]"
																value={
																	currentTicketId
																		? resolutionProof[
																				currentTicketId
																		  ] ||
																		  ""
																		: ""
																}
																onChange={(
																	e
																) => {
																	if (
																		currentTicketId !==
																		null
																	) {
																		setResolutionProof(
																			(
																				prev
																			) => ({
																				...prev,
																				[currentTicketId]:
																					e
																						.target
																						.value,
																			})
																		);
																	}
																}}
															/>
														</div>

														<DialogFooter>
															<Button
																variant="outline"
																onClick={
																	handleProofCancel
																}
															>
																Cancel
															</Button>
															<Button
																onClick={
																	handleProofSubmit
																}
																disabled={
																	currentTicketId ===
																		null ||
																	!resolutionProof[
																		currentTicketId ||
																			0
																	]?.trim()
																}
															>
																Submit
																Resolution
															</Button>
														</DialogFooter>
													</DialogContent>
												</Dialog>

												<td className="px-6 py-4 whitespace-nowrap text-sm text-black">
													{priorityMode[
														ticket.ticket_id
													] ? (
														<Select
															value={
																selectedPriorities[
																	ticket
																		.ticket_id
																] ||
																ticket.priority_level ||
																""
															}
															onValueChange={(
																value
															) =>
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
														<span
															className={`font-semibold px-2 py-1 rounded
															${
																ticket.priority_level ===
																"Low"
																	? "text-green-600 "
																	: ticket.priority_level ===
																	  "Moderate"
																	? "text-yellow-600 "
																	: ticket.priority_level ===
																	  "High"
																	? "text-red-600 "
																	: "text-gray-600 bg-gray-100"
															}
														`}
														>
															{ticket.priority_level ||
																"Not Set"}
														</span>
													)}
												</td>

												<td className="px-6 py-4 whitespace-nowrap text-sm text-black">
													{assignMode[
														ticket.ticket_id
													] ? (
														<Select
															value={
																selectedAssignees[
																	ticket
																		.ticket_id
																] ||
																ticket.assign_to ||
																""
															}
															onValueChange={(
																value
															) =>
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
																	(
																		profile
																	) => (
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
																	String(
																		p.id
																	) ===
																	String(
																		ticket.assign_to
																	)
															)?.display_name ||
																"Unassigned"}
														</span>
													)}
												</td>

												<td className="px-6 py-4 whitespace-nowrap space-y-1 text-sm text-gray-500 flex flex-col items-start">
													{statusMode[
														ticket.ticket_id
													] ? (
														<>
															<div className="flex flex-row gap-2">
																<button
																	className="cursor-pointer font-semibold text-white bg-[#34BFA3] py-1 px-6 rounded-sm hover:text-green-900"
																	onClick={async () => {
																		if (
																			selectedStatus[
																				ticket
																					.ticket_id
																			]
																		) {
																			await updateStatus(
																				ticket.ticket_id,
																				selectedStatus[
																					ticket
																						.ticket_id
																				],
																				resolutionProof[
																					ticket
																						.ticket_id
																				] // pass the proof if status is Resolved
																			);
																		}
																		handleStatus(
																			ticket.ticket_id
																		); // Exit edit mode after saving
																	}}
																>
																	Save
																</button>
																<button
																	className="cursor-pointer font-semibold text-red-600 hover:text-red-900"
																	onClick={async () => {
																		if (
																			selectedStatus[
																				ticket
																					.ticket_id
																			]
																		) {
																			await updateStatus(
																				ticket.ticket_id,
																				selectedStatus[
																					ticket
																						.ticket_id
																				],
																				selectedStatus[
																					ticket
																						.ticket_id
																				] ===
																					"Resolved"
																					? resolutionProof[
																							ticket
																								.ticket_id
																					  ]
																					: undefined
																			);
																		}
																		handleStatus(
																			ticket.ticket_id
																		); // Exit edit mode
																	}}
																>
																	Cancel
																</button>
															</div>
														</>
													) : (
														<button
															className={`text-blue-400 rounded-sm border-blue-400 w-full border-2 py-1 px-7 ${
																userRoles.includes(
																	"Can Edit Status"
																)
																	? "hover:text-indigo-900 font-semibold"
																	: "opacity-50 cursor-not-allowed font-semibold"
															}`}
															disabled={
																!userRoles.includes(
																	"Can Edit Status"
																)
															}
															onClick={() => {
																if (
																	userRoles.includes(
																		"Can Edit Status"
																	)
																) {
																	handleStatus(
																		ticket.ticket_id
																	);
																}
															}}
														>
															Edit Status
														</button>
													)}

													{priorityMode[
														ticket.ticket_id
													] ? (
														<>
															<div className="flex flex-row gap-2">
																<button
																	className="cursor-pointer font-semibold text-white bg-[#34BFA3] py-1 px-6 rounded-sm hover:text-green-900"
																	onClick={async () => {
																		await [
																			updatePriority(
																				ticket.ticket_id
																			),
																		];
																		handlePriority(
																			ticket.ticket_id
																		); // Exit edit mode after saving
																	}}
																>
																	Save
																</button>
																<button
																	className="cursor-pointer font-semibold text-red-600 hover:text-red-900"
																	onClick={() =>
																		handlePriority(
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
															className={`text-blue-400 rounded-sm border-blue-400 w-full border-2 py-1 px-6 ${
																userRoles.includes(
																	"Can Edit Priority"
																)
																	? "hover:text-indigo-900 font-semibold"
																	: "opacity-50 cursor-not-allowed font-semibold"
															}`}
															disabled={
																!userRoles.includes(
																	"Can Edit Priority"
																)
															}
															onClick={() => {
																if (
																	userRoles.includes(
																		"Can Edit Priority"
																	)
																) {
																}
																handlePriority(
																	ticket.ticket_id
																);
															}}
														>
															Edit Priority
														</button>
													)}

													{assignMode[
														ticket.ticket_id
													] ? (
														<>
															<div className="flex flex-row gap-2">
																<button
																	className="cursor-pointer font-semibold text-white bg-[#34BFA3] py-1 px-6 rounded-sm hover:text-green-900"
																	onClick={async () => {
																		await updateAssignedTo(
																			ticket.ticket_id
																		);
																		handleAssign(
																			ticket.ticket_id
																		);
																	}}
																>
																	Save
																</button>
																<button
																	className="cursor-pointer font-semibold text-red-600 hover:text-red-900"
																	onClick={() =>
																		handleAssign(
																			ticket.ticket_id
																		)
																	}
																>
																	Cancel
																</button>
															</div>
														</>
													) : (
														<button
															className={`text-blue-400 rounded-sm border-blue-400 w-full border-2 py-1 px-10 ${
																userRoles.includes(
																	"Can Assign"
																)
																	? "hover:text-indigo-900 font-semibold"
																	: "opacity-50 cursor-not-allowed font-semibold"
															}`}
															disabled={
																!userRoles.includes(
																	"Can Assign"
																)
															}
															onClick={() => {
																if (
																	userRoles.includes(
																		"Can Assign"
																	)
																)
																	handleAssign(
																		ticket.ticket_id
																	);
															}}
														>
															Assign
														</button>
													)}

													<div className="">
														<button
															className="w-full cursor-pointer font-semibold text-white bg-[#34BFA3] py-2 px-4 rounded-md hover:bg-[#2ea38a]"
															onClick={() =>
																handlePdfDownload(
																	ticket.ticket_id
																)
															}
														>
															Generate PDF Report
														</button>
													</div>
												</td>
											</tr>
										))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<div className="flex justify-center mt-4">
				<Pagination>
					<PaginationContent>
						{currentPage > 1 && (
							<PaginationItem>
								<PaginationPrevious
									href="#"
									onClick={() =>
										setCurrentPage((prev) =>
											Math.max(prev - 1, 1)
										)
									}
								/>
							</PaginationItem>
						)}

						{Array.from(
							{ length: Math.ceil(tickets.length / 10) },
							(_, index) => (
								<PaginationItem key={index}>
									<PaginationLink
										href="#"
										onClick={() =>
											setCurrentPage(index + 1)
										}
										isActive={currentPage === index + 1}
									>
										{index + 1}
									</PaginationLink>
								</PaginationItem>
							)
						)}

						{currentPage < Math.ceil(tickets.length / 10) && (
							<PaginationItem>
								<PaginationNext
									href="#"
									onClick={() =>
										setCurrentPage((prev) =>
											Math.min(
												prev + 1,
												Math.ceil(tickets.length / 10)
											)
										)
									}
								/>
							</PaginationItem>
						)}
					</PaginationContent>
				</Pagination>
			</div>
		</div>
	);
};

export default TicketPage;
