import PageTransition from '@/components/PageTransition';
import Video from 'next-video';
import React from 'react';
import SdVideo from '@/videos/splinterdimensional.mp4';
import Lightbox from '@/components/Lightbox';

import Header from '@/app/assets/peanuts/header.png';
import Wide from '@/app/assets/peanuts/wide.png';
import CloseUp from '@/app/assets/peanuts/close.png';

import PeanutsDemo from '@/videos/peanuts.mov';
const Peanuts = () => {
	return (
		<PageTransition>
			<div className="w-full px-8">
				<div className="mt-8 md:w-1/2">
					<h1 className="h1 displayFont">{`Schroeder's Piano`}</h1>

					<p className="text-xl">
						Creating a physical and digital interactive experience for a
						Snoopy-themed exhibit
					</p>
				</div>
				<div className="rounded mt-8">
					<Lightbox imgSrc={Header} />
				</div>

				<div className="mt-12">
					<Video src={PeanutsDemo} />
				</div>

				<div className="flex gap-4 mt-12 flex-col sm:flex-row">
					<div className="flex-1">
						<Lightbox imgSrc={Wide} />
					</div>
					<div className="flex-1">
						<Lightbox imgSrc={CloseUp} />
					</div>
				</div>
			</div>
		</PageTransition>
	);
};

export default Peanuts;
