import WorkCard from '@/components/WorkCard';
import React from 'react';

const Home = () => {
	return (
		<>
			<div className="w-full px-8">
				<div className="mt-8 sm:w-1/2 md:w-2/3">
					<div className="h1 displayFont">
						Roneilla <br />
						Bumanlag
					</div>
				</div>

				<div className="mt-8 sm:w-1/2 md:w-1/3 ml-auto">
					<p className="text-xl">
						Designer & developer focused on creating intuitive and polished
						complex user experiences.{' '}
						<span className="text-gray-500">
							Currently UX Developer at Wagepoint
						</span>
					</p>
				</div>
			</div>
			<div className="mt-20 px-8 flex flex-wrap gap-x-16 gap-y-16">
				<WorkCard
					title={`Wagepoint`}
					description={`Making a design system for a multi-faceted payroll app`}
				/>

				<WorkCard
					title={`Schroeder’s piano`}
					description={`Creating a physical and digital interactive experience for a Snoopy-themed exhibit`}
				/>

				<WorkCard
					title={`The Price of Life`}
					description={`Increasing financial literacy in 10th Graders through the intersection of board game and technology`}
				/>

				<WorkCard
					title={`Splinter Dimensional`}
					description={`AR scavenger hunt adventure through a park in Toronto for an international arts festival`}
				/>

				<WorkCard
					bgColor={'#F1FFF0'}
					title={`Tippt`}
					description={`Creating a sustainable platform to help users make sustainable restaurant choices`}
				/>

				<WorkCard
					title={`RocketBudget`}
					description={`Reimagining personal finance`}
				/>
				<WorkCard
					title={`Karinderia`}
					description={`Filipino cuisine, Papa’s game style`}
				/>
				<WorkCard
					title={`Figma Navigator`}
					description={`Navigate sections and frame with ease`}
				/>
			</div>
		</>
	);
};

export default Home;
