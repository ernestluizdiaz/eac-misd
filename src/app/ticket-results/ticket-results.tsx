"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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

export default function TicketResults() {
	const searchParams = useSearchParams();
	const ticketId = searchParams.get("id");
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
		// Check for predefined descriptions
		const predefinedResponses: { [key: string]: string } = {
			"AIMS password forgot":
				"Try resetting your password by clicking 'Forgot Password' on the AIMS Portal.",
			"network issue":
				"Check your internet connection or restart your router.",
			"software installation":
				"Wait for IT Staff before installing software.",
			"send staff ":
				"Your ticket is submitted, wait for the staff or department head for further assistance. Your ticket will be our first priority.",
		};

		// Check if the description matches any predefined response
		for (const keyword in predefinedResponses) {
			if (description.toLowerCase().includes(keyword)) {
				setAiSolution(predefinedResponses[keyword]);
				return;
			}
		}

		// If no predefined response, use AI
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

	const formatSolution = (solution: string) => {
		return solution
			.replace(/\*\*(.*?)\*\*/g, "**$1**") // Bold text
			.replace(/\n\n/g, "\n\n") // Preserve paragraph spacing
			.replace(/- (.*?)\n/g, "- $1\n") // Keep valid Markdown bullets
			.replace(/### (.*?)\n/g, "### $1\n") // Subheadings
			.replace(/## (.*?)\n/g, "## $1\n"); // Headings
	};
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
