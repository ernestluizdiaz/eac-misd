import TicketForm from "@/components/ticket-form";
import Nav from "@/components/nav";
import Homepage from "@/components/homepage";

export default function Home() {
	return (
		<div>
			<Nav />
			<Homepage />
			<section id="ticket" className="min-h-screen">
				<TicketForm />
			</section>
		</div>
	);
}
