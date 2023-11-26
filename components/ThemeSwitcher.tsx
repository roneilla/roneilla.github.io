import React from 'react';
import useTheme from '@/utils/useTheme';
import { useSpring, animated } from 'react-spring';

const ThemeSwitcher = () => {
	const { setNewTheme, theme } = useTheme();

	const properties = {
		light: {
			r: 9,
			transform: 'rotate(40deg)',
			cx: 12,
			cy: 4,
			lineScale: 'scale(0)',
		},
		dark: {
			r: 5,
			transform: 'rotate(90deg)',
			cx: 30,
			cy: 0,
			lineScale: 'scale(1)',
		},
		springConfig: { mass: 4, tension: 250, friction: 35 },
	};

	const { r, transform, cx, cy, lineScale } =
		properties[theme === 'dark' ? 'dark' : 'light'];

	const svgContainerProps = useSpring({
		transform,
		config: properties.springConfig,
	});
	const centerCircleProps = useSpring({ r, config: properties.springConfig });
	const maskedCircleProps = useSpring({
		cx: cx,
		cy: cy,
		config: properties.springConfig,
	});
	const linesProps = useSpring({
		transform: lineScale,
		transformOrigin: 'center',
		config: properties.springConfig,
	});

	const color = theme === 'dark' ? '#F9C81C' : '#F8E08C';

	return (
		<button
			onClick={setNewTheme}
			className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full w-8 h-8 p-1">
			<animated.svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				stroke={color}
				style={{
					cursor: 'pointer',
					...svgContainerProps,
				}}>
				<mask id="myMask2">
					<rect x="0" y="0" width="100%" height="100%" fill="white" />
					<animated.circle cx={cx} cy={cy} r="9" fill="black" />
				</mask>

				<animated.circle
					cx="12"
					cy="12"
					r={r}
					fill={color}
					mask="url(#myMask2)"
				/>
				<animated.g fill={color} style={linesProps}>
					<line x1="12" y1="1" x2="12" y2="3" />
					<line x1="12" y1="21" x2="12" y2="23" />
					<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
					<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
					<line x1="1" y1="12" x2="3" y2="12" />
					<line x1="21" y1="12" x2="23" y2="12" />
					<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
					<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
				</animated.g>
			</animated.svg>
		</button>
	);
};

export default ThemeSwitcher;
