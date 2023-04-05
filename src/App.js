import React, { useState } from 'react'
import { createBrowserRouter, RouterProvider, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import SplinterDimensional from './pages/projects/SplinterDimensional';
import Tippt from './pages/projects/Tippt';
import ThePriceOfLife from './pages/projects/ThePriceOfLife';
import Peanuts from './pages/projects/Peanuts';
import Home from './pages/Home';
import Error from './pages/Error';
import { Nav } from './components/Nav';

const AnimatedOutlet = () => {
	const o = useOutlet();
	const [outlet] = useState(o);

	return <>{outlet}</>;
}


const AppLayout = () => {
	return (
		<>
			<Nav />
			<AnimatePresence mode="popLayout" >
				<motion.div
					key={window.location.pathname}
					initial={{ opacity: 0, x: 50 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: 50 }}
				>
					<AnimatedOutlet />
				</motion.div>
			</AnimatePresence>
		</>
	)
}


const imageDetails = {
	width: 311,
	height: 311
}

const App = () => {
	const router = createBrowserRouter([
		{
			element: <AppLayout />,
			errorElement: <Error />,
			children: [{
				path: '/',
				element: <Home imageDetails={imageDetails} />,
			},
			{
				path: '/splinter-dimensional',
				element: <SplinterDimensional />,
			},
			{
				path: '/tippt',
				element: <Tippt imageDetails={imageDetails} />
			},
			{
				path: '/the-price-of-life',
				element: <ThePriceOfLife />
			},
			{
				path: '/peanuts',
				element: <Peanuts />
			}]
		},

	]);

	return (
		<RouterProvider router={router} />
	)
}

export default App