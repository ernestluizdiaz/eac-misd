"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Nav = () => {
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);

	// Toggle function
	const toggleMenu = () => {
		setIsOpen(!isOpen);
	};

	return (
		<nav className="bg-white border-gray-200 dark:bg-gray-900 shadow-lg">
			<div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
				<Link
					href="/"
					className="text-xl font-bold text-gray-900 dark:text-white"
				>
					Emilio Aguinaldo College Cavite-MISD
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
					<ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
						<li>
							<Link
								href="/"
								className={`block py-2 px-3 rounded-sm md:p-0 ${
									pathname === "/"
										? "text-red-700"
										: "text-black"
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
								href="/track"
								className={`block py-2 px-3 rounded-sm md:p-0 ${
									pathname === "/track"
										? "text-red-700"
										: "text-black"
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
										? "text-red-700"
										: "text-black"
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
