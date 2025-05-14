// src/components/pdf.tsx (or wherever you place it)
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient"; // adjust path as needed

interface Department {
	name: string;
}

interface Filer {
	name: string;
}

interface Profile {
	display_name: string;
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
	assigned_profile?: Profile;
	created_at: string;
	resolved_at: string;
	proof: string;
}

export const handlePdfDownload = async (ticketId: number) => {
	try {
		const { data, error } = await supabase
			.from("tickets")
			.select(
				`ticket_id, first_name, last_name, email, category, description, priority_level, assign_to, status, created_at, resolved_at, proof,
				department:department_id (name),
				filer:filer_id (name), assigned_profile:assign_to (display_name)`
			)
			.eq("ticket_id", ticketId)
			.single<Ticket>();

		if (error) {
			console.error("Error fetching ticket:", error);
			toast.error("Failed to fetch ticket details.");
			return;
		}

		const doc = new jsPDF();
		doc.setFillColor(22, 101, 52);
		doc.rect(0, 0, 210, 25, "F");
		doc.setFont("helvetica", "bold");
		doc.setTextColor(255, 255, 255);
		doc.setFontSize(20);
		doc.text("TICKET DETAILS", 105, 15, { align: "center" });

		doc.setDrawColor(22, 101, 52);
		doc.setLineWidth(0.5);
		doc.roundedRect(14, 35, 182, 30, 3, 3, "S");
		doc.setTextColor(22, 101, 52);
		doc.setFontSize(14);
		doc.text("Ticket #" + data.ticket_id, 20, 45);

		const statusColor = getHexColor(data.status);
		doc.setFillColor(...hexToRgb(statusColor));
		doc.roundedRect(105, 39, 40, 10, 2, 2, "F");
		doc.setTextColor(0, 0, 0);
		doc.setFontSize(10);
		doc.text(data.status.toUpperCase(), 125, 45, { align: "center" });

		const priorityColor = getHexColor(data.priority_level, true);
		doc.setFillColor(...hexToRgb(priorityColor));
		doc.roundedRect(150, 39, 40, 10, 2, 2, "F");
		doc.text("PRIORITY: " + data.priority_level.toUpperCase(), 170, 45, {
			align: "center",
		});

		doc.setFont("helvetica", "normal");
		doc.setTextColor(0, 0, 0);
		doc.setFontSize(10);
		doc.text(
			`Requester: ${data.first_name} ${data.last_name} (${data.email})`,
			20,
			55
		);
		doc.text(`Department: ${data.department?.name || "N/A"}`, 20, 62);

		const body: [string, string][] = [
			["Category:", data.category],
			["Description:", data.description],
			[
				"Assigned To:",
				data.assigned_profile?.display_name || "Not Assigned",
			],
			["Filed By:", data.filer?.name || "N/A"],
			["Status:", data.status],
			["Priority:", data.priority_level],
			["Created At:", new Date(data.created_at).toLocaleString()],
		];

		const resolvedStatuses = ["resolved"];
		if (resolvedStatuses.includes(data.status.toLowerCase())) {
			if (data.proof) {
				const isUrl = data.proof.startsWith("http");
				body.push([
					"Proof:",
					isUrl ? decodeURIComponent(data.proof) : data.proof,
				]);
			}
			if (data.resolved_at) {
				body.push([
					"Resolved At:",
					new Date(data.resolved_at).toLocaleString(),
				]);
			}
		}

		autoTable(doc, {
			startY: 75,
			head: [["Field", "Details"]],
			body: body,
			headStyles: {
				fillColor: [22, 101, 52],
				textColor: 255,
				fontStyle: "bold",
			},
			alternateRowStyles: { fillColor: [240, 240, 240] },
			columnStyles: {
				0: { fontStyle: "bold", cellWidth: 40 },
				1: { cellWidth: "auto" },
			},
			margin: { top: 75, bottom: 25 },
		});

		const pageCount = doc.getNumberOfPages();
		for (let i = 1; i <= pageCount; i++) {
			doc.setPage(i);
			doc.setFont("helvetica", "italic");
			doc.setFontSize(8);
			doc.setTextColor(100, 100, 100);
			doc.text(
				`Generated on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`,
				105,
				doc.internal.pageSize.height - 10,
				{ align: "center" }
			);
		}

		doc.save(`Ticket_${ticketId}_${data.first_name}_${data.last_name}.pdf`);
		toast.success("PDF generated successfully!");
	} catch (err) {
		console.error("PDF Error:", err);
		toast.error("Failed to generate PDF.");
	}
};

// Utility functions
const hexToRgb = (hex: string): [number, number, number] => {
	hex = hex.replace("#", "");
	const bigint = parseInt(hex, 16);
	const r = (bigint >> 16) & 255;
	const g = (bigint >> 8) & 255;
	const b = bigint & 255;
	return [r, g, b]; // Tuple!
};

const getHexColor = (value: string, isPriority = false): string => {
	const val = value.toLowerCase();
	if (!isPriority) {
		switch (val) {
			case "open":
				return "#FEF08A";
			case "in progress":
				return "#BFDBFE";
			case "closed":
				return "#BBF7D0";
			case "on hold":
				return "#FECACA";
			default:
				return "#E5E7EB";
		}
	} else {
		switch (val) {
			case "low":
				return "#BBF7D0";
			case "medium":
				return "#FEF08A";
			case "high":
				return "#FCA5A5";
			case "critical":
				return "#EF4444";
			default:
				return "#E5E7EB";
		}
	}
};
