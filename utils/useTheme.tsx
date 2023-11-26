'use client';

import { useEffect, useState } from 'react';

const useTheme = () => {
	const [theme, setTheme] = useState<string>('light');

	useEffect(() => {
		if (
			localStorage.theme === 'dark' ||
			(!('theme' in localStorage) &&
				window.matchMedia('(prefers-color-scheme: dark)').matches)
		) {
			setTheme('dark');
		} else {
			setTheme('light');
		}
	}, []);

	useEffect(() => {
		const root = window.document.documentElement;

		if (theme) {
			root.classList.remove(theme === 'light' ? 'dark' : 'light');
			root.classList.add(theme);

			localStorage.setItem('theme', theme);
		}
	}, [theme]);

	const setNewTheme = () => {
		setTheme(theme === 'light' ? 'dark' : 'light');
	};

	return { setNewTheme, theme };
};

export default useTheme;
