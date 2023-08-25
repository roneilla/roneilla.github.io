import React from 'react';
import useTheme from '@/utils/useTheme';

const ThemeSwitcher = () => {
	const { setNewTheme } = useTheme();

	return <button onClick={setNewTheme}>Switch</button>;
};

export default ThemeSwitcher;
