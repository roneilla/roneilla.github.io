'use client';

import React, { useEffect, useState } from 'react';
import { useSpring, animated } from 'react-spring';
import { useRouter } from 'next/navigation';

const PageOutTransition = ({ link, children }: any) => {
	const router = useRouter();

	const [loading, setLoading] = useState(false);

	const handleClick = (e: any) => {
		e.preventDefault();

		setLoading(true);

		setTimeout(() => {
			router.push(link);
		}, 500);
	};

	const properties = {
		start: {
			top: '100vh',
			redD: 200,
			blueD: 100,
			yellowD: 0,
		},
		end: {
			top: '0',
			redD: 0,
			blueD: 100,
			yellowD: 200,
		},
		springConfig: { tension: 250, friction: 35 },
	};

	const { top, redD, blueD, yellowD } = properties[loading ? 'end' : 'start'];

	const red = useSpring({ top, delay: redD, config: properties.springConfig });
	const blue = useSpring({
		top,
		delay: blueD,
		config: properties.springConfig,
	});
	const yellow = useSpring({
		top,
		delay: yellowD,
		config: properties.springConfig,
	});

	return (
		<>
			<div onClick={handleClick} className="cursor-pointer">
				{children}
			</div>
			<animated.div
				style={red}
				className="w-full fixed left-0 h-full r-p3 z-50"
			/>
			<animated.div
				style={blue}
				className="w-full fixed left-0 h-full r-p2 z-50"
			/>
			<animated.div
				style={yellow}
				className="w-full fixed left-0 h-full r-p1 z-50"
			/>
		</>
	);
};

export default PageOutTransition;
