'use client';

import React from 'react';
import Link from 'next/link';
import Button from './Button';
import ThemeSwitcher from './ThemeSwitcher';

const Nav = () => {
	return (
		<div className="flex gap-4 px-4 py-1 items-center">
			<div className="flex-1">
				<p className="font-medium">Roneilla</p>
			</div>

			<nav className="flex flex-1 gap-4 justify-center items-center p-2">
				<Link href="/">
					<div className="navlink">Home</div>
				</Link>
				<Link href="/work">
					<div className="navlink">Work</div>
				</Link>
				<Link href="/info">
					<div className="navlink">Info</div>
				</Link>
			</nav>
			<div className="flex-1 flex justify-end gap-4">
				<ThemeSwitcher />
				<Button>Contact me</Button>
			</div>
		</div>
	);
};

export default Nav;
