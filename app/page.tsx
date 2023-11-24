import WorkCard from '@/components/WorkCard';
import React from 'react';
import Tippt from '@/app/assets/tippt-thumbnail.png';
import Peanuts from '@/app/assets/peanuts-thumbnail.png';
import Sd from '@/app/assets/sd-thumbnail.png';
import Tpol from '@/app/assets/tpol-thumbnail.png';

const Home = () => {
	return (
		<>
			<div className="w-full px-8">
				<div className="mt-8 sm:w-1/2 md:w-2/3">
					<h1 className="h1 displayFont">
						Roneilla <br />
						Bumanlag
					</h1>
				</div>

				<div className="mt-8 sm:w-1/2 md:w-1/3 ml-auto">
					<p className="text-xl">
						Interaction designer and creative developer.{` `}
						<span className="text-gray-500">
							Currently a UX Developer at Wagepoint
						</span>
					</p>
				</div>
			</div>
			<div className="mt-20 px-4 flex flex-wrap">
				<WorkCard
					link="/schroeders-piano"
					imgSrc={Peanuts}
					title={`Schroeder’s piano`}
					description={`Creating a physical and digital interactive experience for a Snoopy-themed exhibit`}
				/>

				<WorkCard
					link="/the-price-of-life"
					imgSrc={Tpol}
					title={`The Price of Life`}
					description={`Increasing financial literacy in 10th Graders through the intersection of board game and technology`}
				/>

				<WorkCard
					link="/tippt"
					imgSrc={Tippt}
					title={`Tippt`}
					description={`Creating a sustainable platform to help users make sustainable restaurant choices`}
				/>

				<WorkCard
					link="/splinter-dimensional"
					imgSrc={Sd}
					title={`Splinter Dimensional`}
					description={`AR scavenger hunt adventure through a park in Toronto for an international arts festival`}
				/>
			</div>
		</>
	);
};

export default Home;
