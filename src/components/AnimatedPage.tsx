import React, { ReactNode } from 'react';

import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageProps {
	children: ReactNode;
}




const AnimatedPage = (props: PageProps) => {

	const location = useLocation()


	return (

		<motion.div
			key={`page-${location.pathname}`}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
		>
			{props.children}
		</motion.div>

	);
};

export default AnimatedPage;
