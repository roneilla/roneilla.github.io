import PageTransition from '@/components/PageTransition';
import React from 'react';
import Video from '@/components/Video';
import Lightbox from '@/components/Lightbox';

import Header from '@/app/assets/peanuts/header.png';
import Wide from '@/app/assets/peanuts/wide.png';
import CloseUp from '@/app/assets/peanuts/close.png';

import ProjectHeader from '@/components/ProjectHeader';
import ProjectFooter from '@/components/ProjectFooter';

const Peanuts = () => {
	return (
		<PageTransition>
			<div className="section">
				<ProjectHeader
					title={`Schroeder's Piano`}
					description={`Creating a physical and digital interactive experience for a Snoopy-themed exhibit`}
					role={`Interaction Designer & Developer`}
				/>

				<div className="rounded mt-8">
					<Lightbox imgSrc={Header} />
				</div>

				<div className="mt-12">
					<Video src={'https://www.youtube.com/watch?v=LMhIu9lH2Xs'} />
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
			<ProjectFooter />
		</PageTransition>
	);
};

export default Peanuts;
