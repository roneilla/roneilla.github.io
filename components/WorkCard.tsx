import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const WorkCard = ({ title, description, imgSrc, link }: any) => {
	return (
		<div className="w-100 sm:w-1/2 md:w-1/3 p-4">
			<Link href={link}>
				<Image
					src={imgSrc}
					alt=""
					className="bg-gray-200 rounded h-72 workCardImg"
				/>
				<p className="font-medium text-xl mt-2">{title}</p>
				<p className="text-gray-400">{description}</p>
			</Link>
		</div>
	);
};

export default WorkCard;
