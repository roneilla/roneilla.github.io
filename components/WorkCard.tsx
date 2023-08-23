import React from 'react';

const WorkCard = ({ bgColor, title, description }: any) => {
	return (
		<div className={`p-6 rounded`} style={{ backgroundColor: bgColor }}>
			<img src="" alt="" className="bg-gray-200 rounded h-72" />
			<p className="font-medium text-xl mt-4 mb-2">{title}</p>
			<p>{description}</p>
		</div>
	);
};

export default WorkCard;
