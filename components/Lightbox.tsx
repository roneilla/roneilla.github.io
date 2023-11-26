'use client';

import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import { useSpring, animated } from 'react-spring';

const Lightbox = ({ imgSrc, altText, className, description }: any) => {
	const [open, setOpen] = useState(false);
	const ref = useRef<any>(null);

	const properties = {
		closed: {
			origOp: 1,
			opacity: 0,
			lightBoxOp: 'rgba(0,0,0,0)',
			top: '100vh',
			transform: 'scale(0)',
		},
		open: {
			origOp: 0,
			opacity: 1,
			lightBoxOp: 'rgba(0,0,0,0.5)',
			top: '0',
			transform: 'scale(1)',
		},
		springConfig: {
			mass: 1,
			tension: 300,
			friction: 26,
			// easing: 'easeOutExpo',
		},
	};

	const { opacity, transform } = properties[open ? 'open' : 'closed'];

	const backdropProps = useSpring({
		opacity,
		config: properties.springConfig,
	});

	const lightBoxProp = useSpring({
		// backgroundColor: lightBoxOp,
		opacity,
		transform,
		config: properties.springConfig,
	});

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
			<animated.div
				className={`backdrop ${open ? 'block' : 'hidden'}`}
				style={backdropProps}
			/>
			<animated.div
				style={lightBoxProp}
				className={`lightbox`}
				onClick={handleClick}>
				<Image
					src={imgSrc}
					alt={altText}
					className={`rounded cursor-pointer z-50 lightboxImg`}
					ref={ref}
				/>
			</animated.div>
			<Image
				src={imgSrc}
				alt={altText}
				className={`rounded cursor-pointer ${className}`}
				onClick={handleOpen}
			/>
			{/* <p className="text-white text-center mt-4">{description}</p> */}
		</>
	);
};

export default Lightbox;
