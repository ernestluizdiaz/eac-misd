"use client";
import React from "react";
import Image from "next/image";
import Logo from "@/../public/img/Call center-rafiki.png";
import Shape from "@/../public/img/rectangle.png";

const Homepage = () => {
	return (
		<div className=" relative flex flex-col items-center justify-center overflow-hidden  min-h-screen">
			<div className="hidden md:block absolute -top-[60px] md:-right-[150px] lg:-right-[50px] -z-10">
				<Image src={Shape} alt="rectangle" />
			</div>
			<div className="flex flex-col-reverse items-center justify-center text-center md:flex-col-reverse lg:flex-row lg:justify-evenly lg:items-center lg:text-start lg:space-x-36">
				<div className="max-w-lg">
					<h1 className="text-3xl font-bold">
						Welcome to <span className="text-[#7E57C2]">MISD</span>
						<span className="text-[#34BFA3]">esk</span>!
					</h1>
					<p className="text-xl mt-4">
						MISDesk is a ticketing system designed to provide fast
						and efficient support for MISD-related concerns. Submit,
						track, and resolve your issues with ease—all in one
						place.
					</p>
					<button
						onClick={() => {
							document
								.getElementById("ticket")
								?.scrollIntoView({ behavior: "smooth" });
						}}
						className="text-white px-6 py-3 rounded-sm hover:cursor-pointer mt-4 bg-[#34BFA3]"
					>
						Submit a Ticket
					</button>
				</div>
				<div className="w-[400px] md:w-[500px] lg:w-[600px]">
					<Image
						src={Logo}
						alt="Logo"
						width={450}
						height={450}
						className="w-full h-auto"
					/>
				</div>
			</div>
		</div>
	);
};

export default Homepage;
