'use client';

import React, { useEffect, useState } from 'react';
import { useSpring, animated } from 'react-spring';

const PageTransition = ({ children }: any) => {
	const [red, api1] = useSpring(
		() => ({
			from: { top: '0' },
			to: { top: '100vh' },
			delay: 200,
			config: { tension: 250, friction: 35 },
		}),
		[]
	);
	const [blue, api2] = useSpring(
		() => ({
			from: { top: '0' },
			to: { top: '100vh' },
			delay: 100,
			config: { tension: 250, friction: 35 },
		}),
		[]
	);
	const [yellow, api3] = useSpring(
		() => ({
			from: { top: '0' },
			to: { top: '100vh' },
			delay: 0,
			config: { tension: 250, friction: 35 },
		}),
		[]
	);
	return (
		<>
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
			<div>{children}</div>
		</>
	);
};

export default PageTransition;
