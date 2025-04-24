"use client";
import React, { useState, FormEvent, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Search, SendHorizontal, Loader2 } from "lucide-react";

interface Department {
	name: string;
}

interface Filer {
	name: string;
}

interface Assignee {
	display_name: string;
	email: string;
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
	department?: Department;
	filer?: Filer;
	assignee?: Assignee;
}

const statusColors: Record<string, string> = {
	Open: "bg-blue-100 text-blue-800",
	"In Progress": "bg-yellow-100 text-yellow-800",
	Resolved: "bg-green-100 text-green-800",
	Closed: "bg-gray-100 text-gray-800",
	Pending: "bg-purple-100 text-purple-800",
};

const priorityColors: Record<string, string> = {
	Low: "bg-green-100 text-green-800",
	Moderate: "bg-yellow-100 text-yellow-800",
	High: "bg-orange-100 text-orange-800",
};

const TrackTickets = () => {
	const [tickets, setTickets] = useState<Ticket[]>([]);
	const [ticketError, setTicketError] = useState<string | null>(null);
	const [inputEmail, setInputEmail] = useState<string>("");
	const [searchEmail, setSearchEmail] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);

	const handleSearch = async (e?: FormEvent) => {
		if (e) {
			e.preventDefault();
		}

		setSearchEmail(inputEmail);

		if (inputEmail.trim() === "") {
			setTickets([]);
			setTicketError(null);
			return;
		}

		setLoading(true);

		const { data, error } = await supabase
			.from("tickets")
			.select(
				`
        ticket_id, first_name, last_name, email, category, description, priority_level, assign_to, status,
        department:department_id (name),
        filer:filer_id (name)
      `
			)
			.ilike("email", `%${inputEmail}%`);

		if (error) {
			setTicketError(error.message);
			setTickets([]);
			setLoading(false);
			return;
		}

		// Process tickets and get assignee information
		const processedTickets = await Promise.all(
			(data || []).map(async (ticket) => {
				const processedTicket: Ticket = {
					...ticket,
					department: Array.isArray(ticket.department)
						? ticket.department[0]
						: ticket.department,
					filer: Array.isArray(ticket.filer)
						? ticket.filer[0]
						: ticket.filer,
				};

				// If there's an assign_to email, fetch the assignee's display name
				if (ticket.assign_to) {
					const { data: assignee, error: assigneeError } =
						await supabase
							.from("profiles")
							.select("display_name, email")
							.eq("id", ticket.assign_to) // Match by ID (UUID) instead of email
							.single();

					if (!assigneeError && assignee) {
						processedTicket.assignee = {
							display_name: assignee.display_name,
							email: assignee.email,
						};
					}
				}

				return processedTicket;
			})
		);

		setTickets(processedTickets);
		setTicketError(null);
		setLoading(false);
	};

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<h1 className="text-3xl font-bold text-center mb-8 text-[#A22630]">
				Track Your Support Tickets
			</h1>

			{/* Search Form */}
			<form
				onSubmit={handleSearch}
				className="flex justify-center items-center mb-10"
			>
				<div className="relative w-full max-w-md">
					<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<Search
							className="text-gray-400"
							width={20}
							height={20}
						/>
					</div>
					<input
						type="email"
						className="w-full px-12 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
						placeholder="Enter your EAC email address..."
						value={inputEmail}
						onChange={(e) => setInputEmail(e.target.value)}
					/>
					<button
						type="submit"
						className="absolute inset-y-0 right-0 px-4 flex items-center bg-blue-500 hover:bg-blue-600 text-white rounded-r-lg transition"
						disabled={loading}
					>
						{loading ? (
							<Loader2
								className="animate-spin"
								width={20}
								height={20}
							/>
						) : (
							<SendHorizontal width={20} height={20} />
						)}
					</button>
				</div>
			</form>

			{/* Loading Indicator */}
			{loading && (
				<div className="flex justify-center">
					<div className="flex items-center justify-center space-x-2">
						<div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
						<div
							className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"
							style={{ animationDelay: "0.2s" }}
						></div>
						<div
							className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"
							style={{ animationDelay: "0.4s" }}
						></div>
					</div>
				</div>
			)}

			{/* Results Header */}
			{searchEmail && !loading && (
				<div className="mb-6">
					<h2 className="text-xl font-semibold text-gray-700">
						{tickets.length > 0
							? `Found ${tickets.length} ticket${
									tickets.length === 1 ? "" : "s"
							  } for ${searchEmail}`
							: `No tickets found for ${searchEmail}`}
					</h2>
				</div>
			)}

			{/* Error Message */}
			{ticketError && (
				<div className="mb-6 p-4 border border-red-300 bg-red-50 rounded-md">
					<p className="text-red-500">{ticketError}</p>
				</div>
			)}

			{/* Ticket Results */}
			<div className="grid grid-cols-1 gap-6">
				{tickets.map((ticket) => (
					<div
						key={ticket.ticket_id}
						className="bg-white border rounded-xl shadow-sm hover:shadow-md transition p-6"
					>
						<div className="flex justify-between items-start mb-4">
							<h2 className="text-xl font-bold text-gray-800">
								Ticket #{ticket.ticket_id}
							</h2>
							<div
								className={`px-3 py-1 rounded-full text-sm font-medium ${
									statusColors[ticket.status] ||
									"bg-gray-100 text-gray-800"
								}`}
							>
								{ticket.status}
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-gray-500 mb-1">
									Submitted by
								</p>
								<p className="text-gray-800 font-medium">
									{ticket.first_name} {ticket.last_name}
								</p>
								<p className="text-gray-600 text-sm">
									{ticket.email}
								</p>
							</div>

							<div>
								<p className="text-sm text-gray-500 mb-1">
									Assigned to
								</p>
								<p className="text-gray-800 font-medium">
									{ticket.assignee
										? ticket.assignee.display_name
										: "Unassigned"}
								</p>
								{ticket.assignee && (
									<p className="text-gray-600 text-sm">
										{ticket.assignee.email}
									</p>
								)}
								{ticket.department && (
									<p className="text-gray-600 text-sm">
										{ticket.department.name} Department
									</p>
								)}
							</div>
						</div>

						<div className="mt-4">
							<p className="text-sm text-gray-500 mb-1">
								Category
							</p>
							<p className="text-gray-800">{ticket.category}</p>
						</div>

						<div className="mt-4">
							<p className="text-sm text-gray-500 mb-1">
								Description
							</p>
							<p className="text-gray-800 bg-gray-50 p-3 rounded-md">
								{ticket.description}
							</p>
						</div>

						<div className="mt-4 flex items-center justify-between">
							<div>
								<span
									className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
										priorityColors[ticket.priority_level] ||
										"bg-gray-100 text-gray-800"
									}`}
								>
									{ticket.priority_level} Priority
								</span>
							</div>
							{ticket.filer && (
								<div className="text-sm text-gray-600">
									Filed by: {ticket.filer.name}
								</div>
							)}
						</div>
					</div>
				))}

				{/* No tickets found */}
				{!loading && tickets.length === 0 && searchEmail && (
					<div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
						<Search
							className="mx-auto text-gray-400 mb-2"
							size={32}
						/>
						<p className="text-gray-500">
							No support tickets found for this email.
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default TrackTickets;
