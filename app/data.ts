import Tippt from '@/app/assets/tippt-thumbnail.png';
import Peanuts from '@/app/assets/peanuts-thumbnail.png';
import Sd from '@/app/assets/sd-thumbnail.png';
import Tpol from '@/app/assets/tpol-thumbnail.png';
import Freshii from '@/app/assets/freshii-thumbnail.png';

const projectData = [
	{
		id: 'schroeder',
		title: `Schroeder’s piano`,
		link: '/schroeders-piano',
		description:
			'Creating a physical and digital interactive experience for a Snoopy-themed exhibit',
		image: Peanuts,
	},
	{
		id: 'tpol',
		title: 'The Price of Life',
		link: '/the-price-of-life',
		description:
			'Increasing financial literacy in 10th Graders through the intersection of board game and technology',
		image: Tpol,
	},
	{
		id: 'tippt',
		title: 'Tippt',
		link: '/tippt',
		description:
			'Creating a sustainable platform to help users make sustainable restaurant choices',
		image: Tippt,
	},
	{
		id: 'splinterD',
		title: 'Splinter Dimensional',
		link: '/splinter-dimensional',
		description:
			'An AR scavenger hunt adventure through a park in Toronto for Luminato festival',
		image: Sd,
	},
	{
		id: 'freshii',
		title: 'Super Mushroom filter',
		link: '/super-mushroom',
		description: `An Instagram filter of a mushroom haircut to promote Freshii’s Super Mushroom gummies`,
		image: Freshii,
	},
	// {
	// 	id: '',
	// 	title: '',
	// 	link: '/',
	// 	description: '',
	// 	image: Tippt,
	// },
];

export default projectData;
