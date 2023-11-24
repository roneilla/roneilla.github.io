'use client';

import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';

const Lightbox = ({ imgSrc, altText, className, description }: any) => {
	const [open, setOpen] = useState(false);
	const ref = useRef<any>(null);

	const handleOpen = () => {
		setOpen(true);
		document.body.style.overflow = 'hidden';
	};

	const handleClick = (e: any) => {
		if (!ref.current?.contains(e.target)) {
			setOpen(false);
			document.body.style.overflow = 'visible';
		}
	};

	useEffect(() => {
		const handleKey = (e: any) => {
			if (e.code === 'Escape') {
				setOpen(false);
				document.body.style.overflow = 'visible';
			}
		};

		document.addEventListener('keydown', handleKey);
		return () => document.removeEventListener('keydown', handleKey);
	}, []);

	return (
		<>
			<Image
				src={imgSrc}
				alt={altText}
				className={`rounded cursor-pointer ` + className}
				onClick={handleOpen}
			/>

			{open && (
				<div
					className="fixed top-0 left-0 w-screen h-screen bg-gray-500/[.8] p-4 z-50 flex items-center justify-center flex-col"
					onClick={handleClick}>
					<Image
						src={imgSrc}
						alt={altText}
						className="rounded lightBoxImg"
						ref={ref}
					/>
					{description && (
						<p className="text-white text-center mt-4">{description}</p>
					)}
				</div>
			)}
		</>
	);
};

export default Lightbox;
