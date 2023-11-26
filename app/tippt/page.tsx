import PageTransition from '@/components/PageTransition';
import Video from '@/components/Video';
import React from 'react';
import Lightbox from '@/components/Lightbox';

import Header from '@/app/assets/tippt/header.png';
import Screens from '@/app/assets/tippt/screens.png';
import Designsystem from '@/app/assets/tippt/designsystem.png';
import ProjectHeader from '@/components/ProjectHeader';
import ProjectFooter from '@/components/ProjectFooter';

const Tippt = () => {
	return (
		<PageTransition>
			<div className="section">
				<ProjectHeader
					title={`Tippt`}
					description={`Creating a sustainable platform to help users make sustainable
						restaurant choices`}
					role={`UX Designer`}
				/>
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
							keep the visual identity cohesive, as well as help the scalability
							of our platform.
						</p>
					</div>

					<div className="mt-4 ">
						<Lightbox imgSrc={Designsystem} />
					</div>
				</div>
			</div>
			<ProjectFooter />
		</PageTransition>
	);
};

export default Tippt;
