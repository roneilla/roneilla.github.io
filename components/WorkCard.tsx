import React from 'react';

const WorkCard = ({ title, description }: any) => {
	return (
		<div className="workCard">
			<img src="" alt="" className="bg-gray-200 rounded h-72" />
			<p className="font-medium text-xl mt-2">{title}</p>
			<p className="text-gray-400">{description}</p>
		</div>
	);
};

export default WorkCard;
