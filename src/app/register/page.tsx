import { ProfileForm } from "@/app/register/register-form";
import Nav from "@/components/nav";

export default function RegisterPage() {
	return (
		<>
			<Nav />
			<div className="flex w-full h-[80svh] items-center justify-center">
				<div className="w-full max-w-md">
					<ProfileForm />
				</div>
			</div>
		</>
	);
}
