import PageTransition from '@/components/PageTransition';
import Video from 'next-video';
import React from 'react';
import SdVideo from '@/videos/splinterdimensional.mp4';
import Lightbox from '@/components/Lightbox';

import Header from '@/app/assets/tippt/header.png';
import Screens from '@/app/assets/tippt/screens.png';
import Designsystem from '@/app/assets/tippt/designsystem.png';

const Tippt = () => {
	return (
		<PageTransition>
			<div className="w-full px-8">
				<div className="mt-8 md:w-1/2">
					<h1 className="h1 displayFont">Tippt</h1>

					<p className="text-xl">
						Creating a sustainable platform to help users make sustainable
						restaurant choices
					</p>
				</div>
				<div className="rounded mt-8">
					<Lightbox imgSrc={Header} />
				</div>
				<div className="mt-12">
					<Lightbox imgSrc={Screens} />
				</div>

				<div className="mt-12">
					<div className="sm:w-1/2">
						<h2 className="h2 displayFont mb-4">Design System</h2>
						<p>
							I improved web accessibility and brand recognition by redesigning
							Tippt’s visual identity. I proposed and created a design system to
							keep our visual identity cohesive, as well as help the scalability
							of our platform. I enabled consistency and scalability through a
							design system.
						</p>
					</div>

					<div className="mt-4 ">
						<Lightbox imgSrc={Designsystem} />
					</div>
				</div>
			</div>
		</PageTransition>
	);
};

export default Tippt;
