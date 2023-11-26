'use client';
import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import projectData from '@/app/data';
import { useSpring, animated } from 'react-spring';
import PageOutTransition from './PageOutTransition';

const ProjectFooter = () => {
	const pathname = usePathname();
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	const properties = {
		start: {
			top: '100vh',
		},
		end: {
			top: '0',
		},
		springConfig: { tension: 250, friction: 35 },
	};

	const { top } = properties[loading ? 'end' : 'start'];

	const props = useSpring({
		top,
		config: properties.springConfig,
	});

	const [currentInd, setCurrentInd] = useState<number>(
		projectData.findIndex((project) => project.link === pathname)
	);

	const [prev, setPrev] = useState<number>(
		currentInd > 0 ? currentInd - 1 : projectData.length - 1
	);

	const [next, setNext] = useState<number>(
		currentInd >= projectData.length - 1 ? 0 : currentInd + 1
	);

	const handleClick = ({ e, link }: any) => {
		e.preventDefault();

		setLoading(true);

		setTimeout(() => {
			router.push(link);
		}, 500);
	};

	return (
		<>
			<animated.div
				style={props}
				className="w-full fixed left-0 h-full r-p1 z-50 trans"
			/>
			<div className="flex justify-between px-8 py-16 mt-4">
				<PageOutTransition link={projectData[prev].link}>
					<h2 className="h2 displayFont">Previous</h2>
					<p className="text-gray-500">{projectData[prev].title}</p>
				</PageOutTransition>
				<PageOutTransition link={projectData[next].link}>
					<div className="text-right">
						<h2 className="h2 displayFont">Next</h2>
						<p className="text-gray-500">{projectData[next].title}</p>
					</div>
				</PageOutTransition>
			</div>
		</>
	);
};

export default ProjectFooter;
