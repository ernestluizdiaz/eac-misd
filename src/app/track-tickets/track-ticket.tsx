"use client";
import React, { useState, FormEvent, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Search, SendHorizontal, Loader2 } from "lucide-react";
import Image from "next/image";
import Pic from "@/../public/img/search.svg";
import Shape from "@/../public/img/Shape2.png";
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
	Pending: "bg-red-100 text-red-800",
};

const priorityColors: Record<string, string> = {
	Low: "bg-green-100 text-green-800",
	Moderate: "bg-yellow-100 text-yellow-800",
	High: "bg-red-100 text-red-800",
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
		<div className="relative">
			<div
				className="fixed top-0 left-0 w-full h-full -z-10 bg-no-repeat"
				style={{
					backgroundImage: `url(${Shape.src})`,
					backgroundPosition: "left 20%",
				}}
			/>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ">
				<div className="flex flex-col lg:flex-row items-center justify-center gap-12 px-6 lg:px-20 py-16">
					{/* SVG/Illustration Side */}
					<div className="w-full lg:w-1/2 flex justify-center">
						<Image
							src={Pic} // Replace this path with your actual path
							alt="Illustration of tracking ticket"
							className="max-w-md w-full"
						/>
					</div>

					{/* Form Side */}
					<div className="w-full lg:w-1/2">
						<h1 className="text-3xl font-bold text-center lg:text-left mb-3 text-gray-800">
							Track Your Support Tickets
						</h1>
						<p className="text-center lg:text-left mb-3 text-gray-800">
							Easily monitor the status of your support requests
							in real-time. E nter your ticket number or EAC email
							to track your tickets.
						</p>
						<form
							onSubmit={handleSearch}
							className="flex justify-center lg:justify-start items-center mb-10"
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
									style={{ borderColor: "#34BFA3" }}
									onFocus={(e) => {
										e.target.style.boxShadow =
											"0 0 0 3px #7E57C2";
									}}
									onBlur={(e) => {
										e.target.style.boxShadow = "none";
									}}
									className="w-full px-12 py-3 border rounded-lg shadow-sm outline-none transition"
									placeholder="Enter your ticket number or EAC email address"
									value={inputEmail}
									onChange={(e) =>
										setInputEmail(e.target.value)
									}
								/>
								<button
									type="submit"
									style={{ backgroundColor: "#34BFA3" }}
									className="absolute inset-y-0 right-0 px-4 flex items-center hover:brightness-110 text-white rounded-r-lg transition"
									disabled={loading}
								>
									{loading ? (
										<Loader2
											className="animate-spin"
											width={20}
											height={20}
										/>
									) : (
										<SendHorizontal
											width={20}
											height={20}
										/>
									)}
								</button>
							</div>
						</form>
					</div>
				</div>

				{loading && (
					<div className="flex justify-center">
						<div className="flex items-center justify-center space-x-2">
							<div className="h-2 w-2 bg-[#34BFA3] rounded-full animate-bounce"></div>
							<div
								className="h-2 w-2 bg-[#34BFA3] rounded-full animate-bounce"
								style={{ animationDelay: "0.2s" }}
							></div>
							<div
								className="h-2 w-2 bg-[#34BFA3] rounded-full animate-bounce"
								style={{ animationDelay: "0.4s" }}
							></div>
						</div>
					</div>
				)}

				{searchEmail && !loading && (
					<div className="mb-6">
						<h2 className="text-xl font-semibold text-black">
							{tickets.length > 0
								? `Found ${tickets.length} ticket${
										tickets.length === 1 ? "" : "s"
								  } for ${searchEmail}`
								: `No tickets found for ${searchEmail}`}
						</h2>
					</div>
				)}

				{ticketError && (
					<div className="mb-6 p-4 border border-red-300 bg-red-50 rounded-md">
						<p className="text-red-500">{ticketError}</p>
					</div>
				)}

				<div className="grid grid-cols-1 gap-6">
					{tickets.map((ticket) => (
						<div
							key={ticket.ticket_id}
							className="bg-white border rounded-xl shadow-sm hover:shadow-md transition p-6"
						>
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
									Ticket #{ticket.ticket_id}
									<span
										className={`px-3 py-1 rounded-full text-sm font-medium ${
											statusColors[ticket.status]
										}`}
									>
										{ticket.status}
									</span>
								</h2>
							</div>

							<div className="mt-4">
								<p
									className="text-sm mb-1"
									style={{ color: "#34BFA3" }}
								>
									Category
								</p>
								<p className="text-gray-800">
									{ticket.category}
								</p>
							</div>

							<div className="mt-4">
								<p
									className="text-sm mb-1"
									style={{ color: "#34BFA3" }}
								>
									Description
								</p>
								<p className="text-gray-800 bg-gray-50 p-3 rounded-md">
									{ticket.description}
								</p>
							</div>

							<div className="mt-4">
								<p
									className="text-sm mb-1"
									style={{ color: "#34BFA3" }}
								>
									Priority Level
								</p>
								<div className="mt-1 flex items-center space-x-2">
									<span
										className="w-2.5 h-2.5 rounded-full"
										style={{
											backgroundColor:
												ticket.priority_level === "High"
													? "#F97316" // orange
													: ticket.priority_level ===
													  "Moderate"
													? "#FACC15" // yellow
													: "#22C55E", // green
										}}
									></span>
									<span className=" text-gray-800">
										{ticket.priority_level} Priority
									</span>
								</div>
							</div>
						</div>
					))}

					{!loading && tickets.length === 0 && searchEmail && (
						<div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
							<Search
								className="mx-auto text-[#34BFA3] mb-2"
								size={32}
							/>
							<p className="text-[#7E57C2] text-m">
								No support tickets found for this email.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default TrackTickets;
