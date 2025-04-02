import nodemailer from "nodemailer";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method Not Allowed" });
	}

	const { to, subject, text, html } = req.body; // Accept both text & HTML

	if (!to || !subject || (!text && !html)) {
		return res.status(400).json({ error: "Missing required fields" });
	}

	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: process.env.SMTP_PORT,
		secure: false, // Use `true` for port 465, `false` for other ports
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
	});

	try {
		await transporter.sendMail({
			from: process.env.SMTP_USER,
			to,
			subject,
			text, // Fallback for clients that don't support HTML
			html, // Use HTML for formatting
		});

		return res.status(200).json({ message: "Email sent successfully!" });
	} catch (error) {
		console.error("Email sending error:", error);
		return res
			.status(500)
			.json({ error: "Email sending failed", details: error.message });
	}
}
