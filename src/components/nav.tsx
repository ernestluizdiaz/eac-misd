"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from 'next/image';
import Logo from "@/../public/img/logo2.png";
const Nav = () => {
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);

	// Toggle function
	const toggleMenu = () => {
		setIsOpen(!isOpen);
	};

	return (
		<nav className="bg-white border-gray-200 dark:bg-gray-900 shadow-lg">
			<div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-3">
			<Link href="/" className="flex items-center gap-2 text-xl font-bold">
				<Image src={Logo} alt="MISDesk Logo" width={40} height={40} />
				<span className="text-[#7E57C2]">MISD<span className="text-[#34BFA3]">esk</span></span>
			</Link>

				{/* Mobile Menu Button */}
				<button
					onClick={toggleMenu}
					type="button"
					className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-[#34BFA3] rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
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
					<ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
						<li>
							<Link
								href="/"
								className={`block py-2 px-3 rounded-sm md:p-0 ${
									pathname === "/"
										? "text-[#34BFA3]"
										: "text-[#7E57C2]"
								}`}
								aria-current={
									pathname === "/" ? "page" : undefined
								}
							>
								Tickets
							</Link>
						</li>
						<li>
							<Link
								href="/track-tickets"
								className={`block py-2 px-3 rounded-sm md:p-0 ${
									pathname === "/track-tickets"
										? "text-[#34BFA3]"
										: "text-[#7E57C2]"
								}`}
							>
								Track Tickets
							</Link>
						</li>
						<li>
							<Link
								href="/login"
								className={`block py-2 px-3 rounded-sm md:p-0 ${
									pathname === "/login"
										? "text-[#34BFA3]"
										: "text-[#7E57C2]"
								}`}
							>
								Login
							</Link>
						</li>
					</ul>
				</div>
			</div>
		</nav>
	);
};

export default Nav;
