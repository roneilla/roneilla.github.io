'use client';

import React, { useEffect, useState } from 'react';
import { useSpring, animated } from 'react-spring';

const PageTransition = ({ children }: any) => {
	const [props, api] = useSpring(
		() => ({
			from: { opacity: 0 },
			to: { opacity: 1 },
			config: { tension: 280, friction: 120 },
		}),
		[]
	);
	return <animated.div style={props}>{children}</animated.div>;
};

export default PageTransition;
