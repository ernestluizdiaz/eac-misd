"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { getAIResponse } from "@/lib/gemini";
import { supabase } from "@/lib/supabaseClient";
import ReactMarkdown from "react-markdown";

interface Ticket {
	first_name: string;
	last_name: string;
	email: string;
	category: string;
	description: string;
}

function TicketResultsContent() {
	const searchParams = useSearchParams();
	const ticketId = searchParams ? searchParams.get("id") : null;
	const [ticket, setTicket] = useState<Ticket | null>(null);
	const [aiSolution, setAiSolution] = useState<string>("");

	useEffect(() => {
		const fetchTicket = async () => {
			if (!ticketId) return;

			const { data, error } = await supabase
				.from("tickets")
				.select("*")
				.eq("ticket_id", ticketId)
				.single();

			if (error) {
				console.error("Error fetching ticket:", error.message);
				return;
			}

			setTicket(data);
			fetchAiSolution(data.description);
		};

		fetchTicket();
	}, [ticketId]);

	const fetchAiSolution = async (description: string) => {
		const predefinedResponses: { [key: string]: string } = {
			"AIMS password forgot":
				"Try resetting your password on the AIMS Portal.",
			"Network Issue":
				"Check your internet connection or restart your router.",
			"Software installation at PC access denied":
				"Wait for IT Staff before installing software.",
			"send support, staff, IT, or any person about support ":
				"Your ticket is submitted, wait for further assistance.",
		};

		for (const keyword in predefinedResponses) {
			if (description.toLowerCase().includes(keyword)) {
				setAiSolution(predefinedResponses[keyword]);
				return;
			}
		}

		try {
			const solution = await getAIResponse(description);
			setAiSolution(solution);
		} catch (error) {
			console.error("Error fetching AI solution:", error);
		}
	};

	if (!ticket)
		return (
			<p className="text-center text-gray-600">
				Loading ticket details...
			</p>
		);

	return (
		<div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg border border-gray-200 my-10">
			<h1 className="text-2xl font-bold text-gray-800 mb-4">
				🎟️ Ticket Details
			</h1>

			<div className="bg-gray-100 p-5 rounded-lg shadow-sm">
				<p className="text-gray-700">
					<strong>Name:</strong> {ticket.first_name}{" "}
					{ticket.last_name}
				</p>
				<p className="text-gray-700">
					<strong>Email:</strong> {ticket.email}
				</p>
				<p className="text-gray-700">
					<strong>Category:</strong> {ticket.category}
				</p>
				<p className="text-gray-700">
					<strong>Description:</strong> {ticket.description}
				</p>
			</div>

			<h2 className="text-xl font-bold text-gray-800 mt-6">
				🤖 Gemini AI Solution
			</h2>
			{aiSolution ? (
				<div className="bg-blue-50 p-5 rounded-lg mt-3 border border-blue-200 shadow-sm leading-relaxed text-gray-800 space-y-4">
					<ReactMarkdown
						components={{
							// Custom components for ReactMarkdown
							p: ({ children }) => (
								<p className="text-justify">{children}</p>
							),
							ul: ({ children }) => (
								<ul className=" list-disc pl-10 space-y-2">
									{children}
								</ul>
							),
							ol: ({ children }) => (
								<ol className=" list-decimal pl-10 ">
									{children}
								</ol>
							),
						}}
					>
						{aiSolution}
					</ReactMarkdown>
				</div>
			) : (
				<p className="text-gray-500 mt-2">Generating solution...</p>
			)}

			<div className="flex justify-center items-center ">
				<button
					className="mt-6 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded"
					onClick={() => (window.location.href = "/")}
				>
					Back to Homepage
				</button>
			</div>
		</div>
	);
}

export default function TicketResults() {
	return (
		<Suspense
			fallback={<p className="text-center text-gray-600">Loading...</p>}
		>
			<TicketResultsContent />
		</Suspense>
	);
}
