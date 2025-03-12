import { LoginForm } from "@/components/login-form";
import Nav from "@/components/nav";

export default function Page() {
	return (
		<>
			<Nav />
			<div className="flex w-full h-[70svh] items-center justify-center">
				<div className="w-full max-w-sm">
					<LoginForm />
				</div>
			</div>
		</>
	);
}
