"use client";
import React, { useState, useEffect, useRef } from "react";
import Tickets from "@/app/dashboard/ticket/page";
import Teams from "@/app/dashboard/teams/page";
import Options from "@/app/dashboard/options/department";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const DashboardNav = () => {
	const [displayName, setDisplayName] = useState<string | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const sidebarRef = useRef<HTMLDivElement>(null);
	const [activeComponent, setActiveComponent] = useState("Tickets");

	useEffect(() => {
		if (typeof window !== "undefined") {
			const storedComponent = localStorage.getItem("activeComponent");
			if (storedComponent) setActiveComponent(storedComponent);
		}
	}, []);

	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("activeComponent", activeComponent);
		}
	}, [activeComponent]);

	useEffect(() => {
		const checkUser = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			if (!session) {
				router.push("/");
			} else {
				setLoading(false);
			}
		};
		checkUser();
	}, [router]);

	useEffect(() => {
		const fetchUser = async () => {
			const { data } = await supabase.auth.getUser();
			if (data?.user) {
				setDisplayName(data.user.user_metadata?.displayName || "Guest");
			}
		};
		fetchUser();
	}, []);

	// Close sidebar when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				sidebarRef.current &&
				!sidebarRef.current.contains(event.target as Node)
			) {
				setSidebarOpen(false);
			}
		};

		if (sidebarOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		} else {
			document.removeEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [sidebarOpen]);

	const handleLogout = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error("Error logging out:", error);
		} else {
			window.location.href = "/";
		}
	};

	return (
		<div>
			<button
				onClick={() => setSidebarOpen(!sidebarOpen)}
				data-drawer-target="default-sidebar"
				data-drawer-toggle="default-sidebar"
				aria-controls="default-sidebar"
				type="button"
				className="inline-cursor-pointer flex items-center p-2 mt-2 ms-3 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
			>
				<span className="sr-only">Open sidebar</span>
				<svg
					className="w-6 h-6"
					aria-hidden="true"
					fill="currentColor"
					viewBox="0 0 20 20"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						clipRule="evenodd"
						fillRule="evenodd"
						d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
					></path>
				</svg>
			</button>

			<aside
				ref={sidebarRef}
				id="default-sidebar"
				className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform ${
					sidebarOpen ? "translate-x-0" : "-translate-x-full"
				} sm:translate-x-0`}
				aria-label="Sidebar"
			>
				<div className="h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
					<ul className="space-y-2 font-medium">
						<li className="flex items-center justify-between p-2 text-xl font-bold">
							<h1>Hi, {displayName}</h1>
						</li>
						<li>
							<button
								onClick={() => setActiveComponent("Tickets")}
								className={`cursor-pointer flex items-center p-2 rounded-lg group w-full 
          ${
				activeComponent === "Tickets"
					? "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white"
					: "text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700"
			}`}
							>
								<svg
									className={`shrink-0 w-5 h-5 transition duration-75 ${
										activeComponent === "Tickets"
											? "text-gray-900 dark:text-white"
											: "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
									}`}
									aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path d="M4 5a2 2 0 0 0-2 2v2.5a1 1 0 0 0 1 1 1.5 1.5 0 1 1 0 3 1 1 0 0 0-1 1V17a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2.5a1 1 0 0 0-1-1 1.5 1.5 0 1 1 0-3 1 1 0 0 0 1-1V7a2 2 0 0 0-2-2H4Z" />
								</svg>

								<span className="ms-3">Tickets</span>
							</button>
						</li>

						<li>
							<button
								onClick={() => setActiveComponent("Teams")}
								className={`cursor-pointer flex items-center p-2 rounded-lg group w-full 
          ${
				activeComponent === "Teams"
					? "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white"
					: "text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700"
			}`}
							>
								<svg
									className={`shrink-0 w-5 h-5 transition duration-75 ${
										activeComponent === "Teams"
											? "text-gray-900 dark:text-white"
											: "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
									}`}
									aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										fillRule="evenodd"
										d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2 9a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4H6Zm7.25-2.095c.478-.86.75-1.85.75-2.905a5.973 5.973 0 0 0-.75-2.906 4 4 0 1 1 0 5.811ZM15.466 20c.34-.588.535-1.271.535-2v-1a5.978 5.978 0 0 0-1.528-4H18a4 4 0 0 1 4 4v1a2 2 0 0 1-2 2h-4.535Z"
										clipRule="evenodd"
									/>
								</svg>

								<span className="ms-3">Teams</span>
							</button>
						</li>
						<li>
							<button
								onClick={() => setActiveComponent("Options")}
								className={`cursor-pointer flex items-center p-2 rounded-lg group w-full 
          ${
				activeComponent === "Options"
					? "bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white"
					: "text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700"
			}`}
							>
								<svg
									className={`shrink-0 w-5 h-5 transition duration-75 ${
										activeComponent === "Options"
											? "text-gray-900 dark:text-white"
											: "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
									}`}
									aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.96 2.96 0 0 0 .13 5H5Z" />
									<path d="M6.737 11.061a2.961 2.961 0 0 1 .81-1.515l6.117-6.116A4.839 4.839 0 0 1 16 2.141V2a1.97 1.97 0 0 0-1.933-2H7v5a2 2 0 0 1-2 2H0v11a1.969 1.969 0 0 0 1.933 2h12.134A1.97 1.97 0 0 0 16 18v-3.093l-1.546 1.546c-.413.413-.94.695-1.513.81l-3.4.679a2.947 2.947 0 0 1-1.85-.227 2.96 2.96 0 0 1-1.635-3.257l.681-3.397Z" />
									<path d="M8.961 16a.93.93 0 0 0 .189-.019l3.4-.679a.961.961 0 0 0 .49-.263l6.118-6.117a2.884 2.884 0 0 0-4.079-4.078l-6.117 6.117a.96.96 0 0 0-.263.491l-.679 3.4A.961.961 0 0 0 8.961 16Zm7.477-9.8a.958.958 0 0 1 .68-.281.961.961 0 0 1 .682 1.644l-.315.315-1.36-1.36.313-.318Zm-5.911 5.911 4.236-4.236 1.359 1.359-4.236 4.237-1.7.339.341-1.699Z" />
								</svg>
								<span className="ms-3">Configuration</span>
							</button>
						</li>
						<li>
							<button
								onClick={handleLogout}
								className="cursor-pointer flex items-center p-2 rounded-lg group w-full text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700"
							>
								<svg
									className="shrink-0 w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
									aria-hidden="true"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 18 16"
								>
									<path
										stroke="currentColor"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M1 8h11m0 0L8 4m4 4-4 4m4-11h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3"
									/>
								</svg>
								<span className=" ms-3">Sign Out</span>
							</button>
						</li>
					</ul>
				</div>
			</aside>

			<div className="p-4 sm:ml-64">
				<div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700">
					{activeComponent === "Tickets" && <Tickets />}
					{activeComponent === "Teams" && <Teams />}
					{activeComponent === "Options" && <Options />}
				</div>
			</div>
		</div>
	);
};

export default DashboardNav;
