"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Logo from "@/../public/img/misdesklogo.png";

const Nav = () => {
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);

	// Toggle function
	const toggleMenu = () => {
		setIsOpen(!isOpen);
	};

	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 10);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<nav
			className={`fixed w-full z-50 transition-all duration-300 ${
				isScrolled
					? "bg-white text-white shadow-lg border-b border-gray-200 "
					: "bg-transparent"
			}`}
		>
			<div className="flex flex-wrap items-center justify-between md:mx-10 lg:mx-20 p-3">
				<Link
					href="/"
					className="flex items-center gap-2 text-xl font-bold"
				>
					<Image
						src={Logo}
						alt="MISDesk Logo"
						width={40}
						height={40}
					/>
					<span className="text-[#7E57C2]">
						MISD<span className="text-[#34BFA3]">esk</span>
					</span>
				</Link>

				{/* Mobile Menu Button */}
				<button
					onClick={toggleMenu}
					type="button"
					className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
					aria-controls="navbar-default"
					aria-expanded={isOpen}
				>
					<span className="sr-only">Open main menu</span>
					<svg
						className="w-5 h-5"
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 17 14"
					>
						<path
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M1 1h15M1 7h15M1 13h15"
						/>
					</svg>
				</button>

				{/* Navigation Links */}
				<div
					className={`w-full md:block md:w-auto ${
						isOpen ? "block" : "hidden"
					}`}
					id="navbar-default"
				>
					<ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0">
						{[
							{ href: "/", label: "Tickets" },
							{ href: "/track-tickets", label: "Track Tickets" },
							{ href: "/login", label: "Login" },
						].map(({ href, label }) => (
							<li key={href}>
								<Link
									href={href}
									className={`block py-2 px-3 rounded-sm md:p-0 ${
										pathname === href
											? isScrolled
												? "text-[#7E57C2] font-bold"
												: "text-white font-bold"
											: isScrolled
											? "text-[#7E57C2]"
											: "text-white"
									}`}
									aria-current={
										pathname === href ? "page" : undefined
									}
								>
									{label}
								</Link>
							</li>
						))}
					</ul>
				</div>
			</div>
		</nav>
	);
};

export default Nav;
