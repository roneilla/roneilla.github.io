'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import { useSpring, animated } from 'react-spring';
import { useRouter } from 'next/navigation';
import PageOutTransition from './PageOutTransition';

const WorkCard = ({ title, description, imgSrc, link }: any) => {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	const properties = {
		start: {
			top: '100vh',
		},
		end: {
			top: '0',
		},
		springConfig: { tension: 250, friction: 35 },
	};

	const { top } = properties[loading ? 'end' : 'start'];

	const props = useSpring({
		top,
		config: properties.springConfig,
	});

	const handleClick = (e: any) => {
		e.preventDefault();

		setLoading(true);

		setTimeout(() => {
			router.push(link);
		}, 500);
	};

	return (
		<>
			<animated.div
				style={props}
				className="w-full fixed left-0 h-full r-p1 z-50 trans"
			/>
			<div className="w-100 sm:w-1/2 md:w-1/3 p-4 cursor-pointer">
				<PageOutTransition link={link}>
					<Image
						src={imgSrc}
						alt=""
						className="bg-gray-200 rounded h-72 workCardImg"
					/>
					<p className="text-xl mt-4 mb-1">{title}</p>
					<p className="text-gray-500 dark:text-gray-300">{description}</p>
				</PageOutTransition>
			</div>
		</>
	);
};

export default WorkCard;
