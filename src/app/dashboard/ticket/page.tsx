"use client";
import React, { useState } from "react";

const TicketPage = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [sortOption, setSortOption] = useState("");

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
	};

	const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSortOption(e.target.value);
	};

	return (
		<div className="p-6">
			<div>
				<div className="flex justify-between mb-6">
					<input
						type="text"
						placeholder="Search..."
						value={searchTerm}
						onChange={handleSearchChange}
						className="border p-2 rounded-lg text-sm shadow-sm lg:w-[25%]"
					/>
					<select
						value={sortOption}
						onChange={handleSortChange}
						className="border p-2 rounded-lg shadow-sm"
					>
						<option value="">Sort By</option>
						<option value="department">Earliest</option>
						<option value="submitted">Latest</option>
					</select>
				</div>
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Name
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Email Address
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Submit By
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Department
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Issue Category
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Description
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
									Actions
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							<tr>
								<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
									add1
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									add1
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									add1
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									add1
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									add1
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									add1
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
									<button className="text-indigo-600 hover:text-indigo-900">
										Edit
									</button>
									<button className="text-red-600 hover:text-red-900 ml-4">
										Delete
									</button>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

export default TicketPage;
