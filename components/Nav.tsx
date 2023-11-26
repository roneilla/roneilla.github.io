'use client';

import React, { useEffect, useState } from 'react';
import Button from './Button';
import ThemeSwitcher from './ThemeSwitcher';
import { usePathname, useRouter } from 'next/navigation';
import { useSpring, animated } from 'react-spring';
import Image from 'next/image';
import useTheme from '@/utils/useTheme';
import Logo from './Logo';

const Nav = () => {
	const pathname = usePathname();
	const router = useRouter();

	const [loading, setLoading] = useState(false);

	const { theme } = useTheme();

	const handleClick = ({ e, link }: any) => {
		e.preventDefault();

		if (pathname === '/') return;

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
			<animated.div
				className={`bg-white dark:bg-black flex gap-4 px-8 md:px-12 py-2 items-center z-30 `}>
				{pathname != '/' ? (
					<Button
						withArrow={true}
						handleClick={(e: any) => handleClick({ e, link: '/' })}>
						Back to home
					</Button>
				) : (
					<div onClick={(e) => handleClick({ e, link: '/' })}>
						<div className="navLogo">
							<Logo />
						</div>

						{/* <Image
							style={{ fill: 'white' }}
							src={Logo}
							className="navLogo"
							alt="A logo depicting an ampersand "
						/> */}
					</div>
				)}

				<div className="flex-1 flex items-center justify-end gap-4">
					<ThemeSwitcher />
					{/* <Button>Contact me</Button> */}
				</div>
			</animated.div>

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

export default Nav;
