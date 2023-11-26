import React from 'react';

const Button = ({ withArrow = false, children, handleClick}: any) => {
	return (
		<button onClick={handleClick} className={`button ${withArrow ? 'buttonWithArrow' : ''}`}>
			{children}
		</button>
	);
};

export default Button;
