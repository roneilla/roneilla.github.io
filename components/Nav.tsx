'use client';

import React, { useState } from 'react';
import Button from './Button';
import ThemeSwitcher from './ThemeSwitcher';
import { useRouter } from 'next/navigation';
import { useSpring, animated } from 'react-spring';

const Nav = () => {
	const router = useRouter();

	const [loading, setLoading] = useState(false);

	const handleClick = ({ e, link }: any) => {
		e.preventDefault();

		setLoading(true);

		setTimeout(() => {
			router.push(link);
		}, 500);

		setTimeout(() => {
			setLoading(false);
		}, 1000);
	};

	const properties = {
		start: {
			top: '100vw',
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
		<div className="flex gap-4 px-4 py-1 items-center">
			<div className="flex-1">
				<p className="font-medium">Roneilla</p>
			</div>

			<nav className="flex flex-1 gap-4 justify-center items-center p-2">
				<div onClick={(e) => handleClick({ e, link: '/' })}>
					<div className="navlink">Home</div>
				</div>
				{/* <Link href="/work">
					<div className="navlink">Work</div>
				</Link> */}
				<div onClick={(e) => handleClick({ e, link: '/info' })}>
					<div className="navlink">Info</div>
				</div>
			</nav>
			<div className="flex-1 flex justify-end gap-4">
				<ThemeSwitcher />
				<Button>Contact me</Button>
			</div>

			<animated.div
				style={red}
				className="w-full fixed left-0 h-full bg-red-700"
			/>
			<animated.div
				style={blue}
				className="w-full fixed left-0 h-full bg-blue-700"
			/>
			<animated.div
				style={yellow}
				className="w-full fixed left-0 h-full bg-yellow-600"
			/>
		</div>
	);
};

export default Nav;
