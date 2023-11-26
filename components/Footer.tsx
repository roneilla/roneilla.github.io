import Link from 'next/link';
import React from 'react';

const Footer = () => {
	return (
		<footer className="footer text-black">
			<div className="flex flex-col gap-2">
				<Link href="https://www.linkedin.com/in/roneilla/" target="_blank">
					LinkedIn ↗
				</Link>
				<Link href="https://github.com/roneilla" target="_blank">
					GitHub ↗
				</Link>
				<Link href="mailto:roneillabumanlag@gmail.com" target="_blank">
					Email ↗
				</Link>
			</div>
			<div className="flex flex-col gap-2 items-end">
				<p>Created using NextJS</p>
				<p>© Roneilla Bumanlag 2023</p>
			</div>
		</footer>
	);
};

export default Footer;
