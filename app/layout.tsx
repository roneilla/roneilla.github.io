import Nav from '@/components/Nav';
import './globals.css';
import type { Metadata } from 'next';
import Loader from '@/components/Loader';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
	title: 'Roneilla Bumanlag - Interaction Designer',
	description: 'Interaction Designer & Creative Developer based in Toronto',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={`body`}>
				<Loader />

				<Nav />

				<div className="page">{children}</div>
				<Footer />
			</body>
		</html>
	);
}
