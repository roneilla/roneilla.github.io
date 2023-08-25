'use client';

import React, { useEffect, useState } from 'react';

const ThemeContainer = ({ children }: { children: React.ReactNode }) => {
	const [darkMode, setDarkMode] = useState(true);

	useEffect(() => {
		if (
			localStorage.theme === 'dark' ||
			(!('theme' in localStorage) &&
				window.matchMedia('(prefers-color-scheme: dark)').matches)
		) {
			setDarkMode(true);
		} else {
			setDarkMode(false);
		}
	}, []);

	return <div className={`${darkMode ? 'dark' : 'light'}`}>{children}</div>;
};

export default ThemeContainer;
