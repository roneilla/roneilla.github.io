'use client';

import useTheme from '@/utils/useTheme';
import React from 'react';

const Loader = () => {
	const { theme } = useTheme();

	if (theme) return;

	return (
		<div className="w-screen h-screen top-0 left-0 fixed bg-slate-400 z-50">
			Loader
		</div>
	);
};

export default Loader;
