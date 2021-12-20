<template>
	<div>
		<header>
			<Nav />
		</header>
		<main>
			<Nuxt />
		</main>
		<Footer />
	</div>
</template>

<script>
	export default {}
</script>

<style>
	body {
		font-size: 18px;
	}
	h1 {
		font-size: 3.5rem;
	}

	h2 {
		font-size: 3rem;
	}

	h3 {
		font-size: 2rem;
	}

	h4 {
		font-size: 1.75rem;
	}

	p {
		font-size: 1rem;
	}

	.rb-border-top {
		border-top: 2px solid black;
	}
	.rb-border-bottom {
		border-bottom: 2px solid black;
	}

	.rb-section-min-height {
		min-height: 80vh;
	}

	.tag {
		@apply inline-block border-solid border-2 border-black py-0.5 px-2 rounded-full uppercase my-1 mr-2;
	}

	.max-80vh {
		max-height: 80vh;
	}
</style>