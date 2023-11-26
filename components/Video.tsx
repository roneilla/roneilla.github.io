'use client';

import React from 'react';
import ReactPlayer from 'react-player/lazy';

const Video = ({ src }: any) => {
	return (
		<>
			<ReactPlayer width="100%" height="80vh" url={src} />
		</>
	);
};

export default Video;
