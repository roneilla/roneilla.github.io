'use client';

import Video from '@/components/Video';
import React from 'react';
import Lightbox from '@/components/Lightbox';

import BgWide from '@/app/assets/tpol/boardgame-wideview-2.png';
import BgClose from '@/app/assets/tpol/boardgame-closeup.png';
import Cards from '@/app/assets/tpol/cards.png';
import Guidebook from '@/app/assets/tpol/guidebook.png';
import PlayerDash from '@/app/assets/tpol/player-dashboard.png';
import GamemasterDash from '@/app/assets/tpol/gamemaster-dashboard.png';
import PageTransition from '@/components/PageTransition';
import ProjectHeader from '@/components/ProjectHeader';
import ProjectFooter from '@/components/ProjectFooter';

const Tpol = () => {
	return (
		<PageTransition>
			<div className="section">
				<ProjectHeader
					title={`The Price of Life`}
					description={`An educational board game that teaches young adults the basics of
						personal finance, strategy, and planning.`}
					role={`Interaction Designer & Developer`}
				/>
				<div className="rounded mt-8">
					<Video src={'https://www.youtube.com/watch?v=IDXo6CgnCGc'} />
				</div>

				<div className="mt-12">
					<h2 className="h2 displayFont mb-4">Board game</h2>
					<Lightbox
						imgSrc={BgWide}
						altText="A board game laid out with a deck of cards and a guidebook. There are 4 pieces of cones (player pieces) on the board."
					/>

					<div className="flex gap-4 mt-4 flex-col sm:flex-row">
						<div className="flex-1">
							<Lightbox imgSrc={BgClose} className="h-full object-cover" />
						</div>
						<div className="flex-1">
							<Lightbox imgSrc={Guidebook} />
						</div>
						<div className="flex-1">
							<Lightbox imgSrc={Cards} />
						</div>
					</div>
				</div>

				<div className="mt-12">
					<h2 className="h2 displayFont">Companion app</h2>

					<div className="flex gap-4 mt-4 flex-col sm:flex-row">
						<div className="flex-1 imgContainer tpol-yellow">
							<Lightbox imgSrc={PlayerDash} />
						</div>
						<div className="flex-1 imgContainer tpol-blue">
							<Lightbox imgSrc={GamemasterDash} />
						</div>
					</div>
				</div>
			</div>
			<ProjectFooter />
		</PageTransition>
	);
};

export default Tpol;
