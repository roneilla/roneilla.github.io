import React from 'react';
import AnimatedPage from '../components/AnimatedPage';
import { ProjectCard } from '../components/ProjectCard';
import Tippt from '../assets/tippt.png'

const projects = [{
	name: "Tippt",
	link: 'tippt',
	img: Tippt,
	description: 'A platform providing users with quick access to information they need to make sustainable choices'
}, {
	name: "Price of Life",
	link: 'the-price-of-life',
	description: 'An educational board game that teaches young adults the basics of personal finance, strategy, and planning.'
}, {
	name: "Splinter Dimensional",
	link: 'splinter-dimensional',
	description: 'AR scavenger hunt adventure through a park in Toronto for an international festival'
}, {
	name: "Peanuts Beethoven",
	link: 'peanuts',
	description: 'An interactive piano game to accompany a talking bust for a themed exhibition'
}]

interface HomeProps {
	imageDetails: any;
}

const Home = ({ imageDetails }: HomeProps) => {
	return (
		<AnimatedPage>
			<div className="text-center my-16">
				<p className="w-1/2 inline-block text-primary mt-2 text-lg">I’m a UX designer and developer. Currently enhancing the payroll experience for small businesses at Wagepoint.</p>
			</div>
			<div className='border-b border-primary border-solid mt-8 mx-4'>
				<h2 className='pb-1 text-primary font-medium'>Case Studies</h2>
			</div>
			<div className='mt-4 flex flex-wrap'>
				{projects.map((project, index) => { return (<ProjectCard imageDetails={imageDetails} name={project.name} key={index} description={project.description} link={project.link} img={project.img} />) })}
			</div>
		</AnimatedPage>
	);
};

export default Home;
