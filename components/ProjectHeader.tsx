import React from 'react';

const ProjectHeader = ({ title, description, role }: any) => {
	return (
		<div className="mt-8 md:w-2/3">
			<h1 className="h1 displayFont">{title}</h1>
			<p className="text-xl mt-2">{description}</p>
			<p className="text-gray-500 mt-8">Role: {role}</p>
		</div>
	);
};

export default ProjectHeader;
