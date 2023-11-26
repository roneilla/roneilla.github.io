import PageTransition from '@/components/PageTransition';
import Video from '@/components/Video';
import React from 'react';
import Lightbox from '@/components/Lightbox';

import FreshiiFilter from '@/app/assets/mushroom/freshii-filter.png';
import FreshiiIg from '@/app/assets/mushroom/freshii-ig.jpg';
import ProjectHeader from '@/components/ProjectHeader';
import ProjectFooter from '@/components/ProjectFooter';

const Mush = () => {
	return (
		<PageTransition>
			<div className="section">
				<ProjectHeader
					title={`Freshii Super Mushroom filter`}
					description={`An Instagram filter of a mushroom haircut to promote Freshii’s Super
						Mushroom gummies`}
					role={`Interaction Designer & Developer`}
				/>
				<div className="rounded mt-8">
					<Video src={'https://www.youtube.com/watch?v=GjFVKu3kSM4'} />
				</div>
				<div className="flex gap-4 mt-12 flex-col sm:flex-row">
					<div className="flex-1 imgContainer freshii-green">
						<Lightbox imgSrc={FreshiiFilter} className="phoneImg" />
					</div>
					<div className="flex-1 imgContainer freshii-green">
						<Lightbox imgSrc={FreshiiIg} className="phoneImg" />
					</div>
				</div>
			</div>
			<ProjectFooter />
		</PageTransition>
	);
};

export default Mush;
