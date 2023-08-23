import WorkCard from '@/components/WorkCard';
import React from 'react';

const Home = () => {
	return (
		<>
			<div className="mt-8 px-4">
				<div className="h1">Roneilla Bumanlag</div>
				<p className="text-xl w-3/4">
					Designer & developer focused on creating intuitive and polished
					complex user experiences
				</p>
				<p className="text-gray-500 mt-10">
					Currently UX Developer at Wagepoint
				</p>
			</div>

			<div className="mt-20 px-4">
				<h2 className="h2 mb-4">Work</h2>

				<WorkCard
					bgColor={'#F2F9E3'}
					title={`Wagepoint`}
					description={`Making a design system for a multi-faceted payroll app`}
				/>

				<div className="flex gap-6 mt-6">
					<div className="flex-1">
						<WorkCard
							bgColor={'#FFF3F3'}
							title={`Schroeder’s piano`}
							description={`Creating a physical and digital interactive experience for a Snoopy-themed exhibit`}
						/>
					</div>
					<div className="flex-1">
						<WorkCard
							bgColor={'#F9F4E9'}
							title={`The Price of Life`}
							description={`Increasing financial literacy in 10th Graders through the intersection of board game and technology`}
						/>
					</div>
				</div>

				<div className="flex gap-6 mt-6">
					<div className="flex-1">
						<WorkCard
							bgColor={'#FCF2F7'}
							title={`Splinter Dimensional`}
							description={`AR scavenger hunt adventure through a park in Toronto for an international arts festival`}
						/>
					</div>
					<div className="flex-1">
						<WorkCard
							bgColor={'#F1FFF0'}
							title={`Tippt`}
							description={`Creating a sustainable platform to help users make sustainable restaurant choices`}
						/>
					</div>
				</div>
			</div>
			<div className="mt-20 px-4">
				<h2 className="h2 mb-4">Projects</h2>

				<div className="flex flex-col gap-6">
					<WorkCard
						bgColor={'#EEFDFF'}
						title={`RocketBudget`}
						description={`Reimagining personal finance`}
					/>
					<WorkCard
						bgColor={'#FFF3F3'}
						title={`Karinderia`}
						description={`Filipino cuisine, Papa’s game style`}
					/>
					<WorkCard
						bgColor={'#FAFAFA'}
						title={`Figma Navigator`}
						description={`Navigate sections and frame with ease`}
					/>
				</div>
			</div>
		</>
	);
};

export default Home;
