import Nav from '@/components/Nav';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Footer from '@/components/Footer';
import ThemeContainer from '@/components/ThemeContainer';
import useTheme from '@/utils/useTheme';
import Loader from '@/components/Loader';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Create Next App',
	description: 'Generated by create next app',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className="dark">
			<body className={`${inter.className} body`}>
				<Loader />
				<Nav />
				<ThemeContainer>
					<div className="page">{children}</div>
				</ThemeContainer>
				<Footer />
			</body>
		</html>
	);
}
