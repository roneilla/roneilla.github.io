import PageTransition from '@/components/PageTransition';
import Video from 'next-video';
import React from 'react';
import SdVideo from '@/videos/splinterdimensional.mp4';
import Lightbox from '@/components/Lightbox';

import Intro from '@/app/assets/sd/0-intro.gif';
import Training from '@/app/assets/sd/1-training.gif';
import Pineapple from '@/app/assets/sd/2-pineapple.gif';
import Peacock from '@/app/assets/sd/3 - peacock.gif';
import Dance from '@/app/assets/sd/5 - dance.gif';
import Stars from '@/app/assets/sd/7 - stars.gif';
import Frame from '@/app/assets/sd/frame.jpg';

const SdAr = () => {
	return (
		<PageTransition>
			<div className="w-full px-8">
				<div className="mt-8 md:w-1/2">
					<h1 className="h1 displayFont">Splinter Dimensional</h1>

					<p className="text-xl">
						AR scavenger hunt adventure through a park in Toronto for Luminato
						Festival
					</p>
				</div>
				<div className="rounded mt-8">
					<Video src={SdVideo} />
				</div>

				<div className="mt-12">
					<div className="sm:w-1/2">
						<h2 className="h2 displayFont mb-4">Introduction & training</h2>
						<p>
							Users tap to place the captain on the ground in front of them.
							They are introduced to the story and objective of the experience.
							The users’ goals are to find “rifts” by scanning markers and close
							them!
							<br />
							<br />
							The captain guides them through a training stage where they learn
							what markers look like as well as actions they need to take to
							“close the rift”. There is audio feedback at each action so users
							know when their action was successful
						</p>
					</div>

					<div className="flex gap-4 mt-4 flex-col sm:flex-row imgHeight">
						<div className="flex-1 gifContainer pink">
							<Lightbox imgSrc={Intro} />
						</div>
						<div className="flex-1 gifContainer blue">
							<Lightbox imgSrc={Training} />
						</div>
					</div>
				</div>
				<div className="mt-12">
					<div className="sm:w-1/2">
						<h2 className="h2 displayFont mb-4">Scavenger hunt finds!</h2>
						<p>
							These are examples of the rifts the users find during the
							scavenger hunt. The captain stays “on the phone” audio and guides
							them through what they need to do. Each stage has a slightly
							different instruction to avoid repetitiveness.
						</p>
					</div>

					<div className="flex gap-4 mt-4 flex-col sm:flex-row">
						<div className="flex-1 gifContainer blue">
							<Lightbox imgSrc={Pineapple} />
						</div>
						<div className="flex-1 gifContainer pink">
							<Lightbox imgSrc={Peacock} />
						</div>
					</div>
				</div>
				<div className="mt-12">
					<div className="sm:w-1/2">
						<h2 className="h2 displayFont mb-4">Thanks and Next Steps</h2>
						<p>
							{/* TODO update! */}
							Stars all around, place your star narrative community feeling
							seeing others did the experience as well (coloured stars are other
							people) You are the nth person!
						</p>
					</div>

					<div className="flex gap-4 mt-4 flex-col sm:flex-row">
						<div className="flex-1 gifContainer pink">
							<Lightbox imgSrc={Dance} />
						</div>
						<div className="flex-1 gifContainer blue">
							<Lightbox imgSrc={Stars} />
						</div>
						<div className="flex-1 gifContainer purple">
							<Lightbox imgSrc={Frame} />
						</div>
					</div>
				</div>
			</div>
		</PageTransition>
	);
};

export default SdAr;
