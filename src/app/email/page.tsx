"use client";
import { useState } from "react";

interface EmailData {
	to: string;
	subject: string;
	text: string;
}

export default function Home() {
	const [emailData, setEmailData] = useState<EmailData>({
		to: "",
		subject: "",
		text: "",
	});

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		setEmailData((prevEmailData: EmailData) => ({
			...prevEmailData,
			[e.target.name]: e.target.value,
		}));
	};

	const sendEmail = async (e: { preventDefault: () => void }) => {
		e.preventDefault();
		const response = await fetch("/api/send-email", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(emailData),
		});

		const data = await response.json();
		alert(data.message || data.error);
	};

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				padding: "20px",
			}}
		>
			<h1 style={{ marginBottom: "20px" }}>Send Email</h1>
			<form
				onSubmit={sendEmail}
				style={{
					display: "flex",
					flexDirection: "column",
					width: "100%",
					maxWidth: "400px",
					gap: "10px",
				}}
			>
				<input
					type="email"
					name="to"
					placeholder="Recipient Email"
					onChange={handleChange}
					required
					style={{
						padding: "10px",
						border: "1px solid #ccc",
						borderRadius: "5px",
					}}
				/>
				<input
					type="text"
					name="subject"
					placeholder="Subject"
					onChange={handleChange}
					required
					style={{
						padding: "10px",
						border: "1px solid #ccc",
						borderRadius: "5px",
					}}
				/>
				<textarea
					name="text"
					placeholder="Message"
					onChange={handleChange}
					required
					style={{
						padding: "10px",
						border: "1px solid #ccc",
						borderRadius: "5px",
						resize: "none",
						height: "100px",
					}}
				/>
				<button
					type="submit"
					style={{
						padding: "10px",
						backgroundColor: "#007BFF",
						color: "#fff",
						border: "none",
						borderRadius: "5px",
						cursor: "pointer",
					}}
				>
					Send Email
				</button>
			</form>
		</div>
	);
}
