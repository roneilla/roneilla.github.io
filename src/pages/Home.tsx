import React from 'react';
import AnimatedPage from '../components/AnimatedPage';
import { ProjectCard } from '../components/ProjectCard';
import TipptImg from '../assets/tippt.png';
import SchroederImg from '../assets/schroeder.jpeg';
import TpolImg from '../assets/tpol.png';

const projects = [
	{
		name: 'Schroeder’s piano',
		link: 'peanuts',
		img: SchroederImg,
		description:
			'Creating a physical and digital interactive experience for a Snoopy-themed exhibit',
		bgColor: 'bg-schroeder',
	},
	{
		name: 'Tippt',
		link: 'tippt',
		img: TipptImg,
		description:
			'A platform providing users with quick access to information they need to make sustainable choices',
		bgColor: 'bg-tippt',
	},
	{
		name: 'Price of Life',
		link: 'the-price-of-life',
		img: TpolImg,
		description:
			'An educational board game that teaches young adults the basics of personal finance, strategy, and planning.',
		bgColor: 'bg-tpol',
	},
	{
		name: 'Splinter Dimensional',
		link: 'splinter-dimensional',
		description:
			'AR scavenger hunt adventure through a park in Toronto for an international festival',
		bgColor: 'bg-splinter',
	},
];

interface HomeProps {
	imageDetails: any;
}

const Home = ({ imageDetails }: HomeProps) => {
	return (
		<AnimatedPage>
			<div className="text-center my-16">
				<p className="w-1/2 inline-block text-primary mt-2 text-lg">
					Roneilla Bumanlag
				</p>
				<p className="font-serif text-primary text-5xl">Designer & Developer</p>
			</div>
			<div className="mt-8 mx-4">
				<h2 className="pb-1 text-primary font-medium">Case Studies</h2>
			</div>
			<div className="mt-4 flex flex-wrap">
				{projects.map((project, index) => {
					return (
						<ProjectCard
							imageDetails={imageDetails}
							name={project.name}
							key={index}
							description={project.description}
							link={project.link}
							img={project.img}
							color={project.bgColor}
						/>
					);
				})}
			</div>
		</AnimatedPage>
	);
};

export default Home;
