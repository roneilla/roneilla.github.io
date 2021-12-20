<template>
	<footer class="bg-main-light w-full px-4">
		<div
			id="inner-div"
			class="
				rb-border-top
				bg-main-light
				flex flex-col
				md:flex-row
				items-start
				md:items-center
				justify-center
				md:justify-between
				py-4
				text-base
			"
		>
			<div class="md:flex-1">© Roneilla Bumanlag 2022</div>
			<div class="md:flex-initial mt-4 md:m-0">
				<a href="mailto:roneillabumanlag@gmail.com"
					>roneillabumanlag@gmail.com</a
				>
			</div>
			<ul
				class="
					flex
					items-center
					justify-start
					md:justify-end md:flex-1
					mt-4
					md:m-0
				"
			>
				<li>
					<a target="_blank" href="https://www.linkedin.com/in/roneilla/"
						>LinkedIn</a
					>
				</li>
				<li>
					<a target="_blank" href="https://www.instagram.com/eillamadethis/"
						>Instagram</a
					>
				</li>
				<li>
					<a target="_blank" href="https://dribbble.com/roneilla">Dribbble</a>
				</li>
			</ul>
		</div>
		<!-- <div class="w-full py-2">
			<p class="text-grey text-xs">
				Developed and Built using Vue/NuxtJS &amp; Tailwind CSS
			</p>
		</div> -->
	</footer>
</template>

<script>
	export default {}
</script>

<style scoped>
	#inner-div {
		font-weight: 400;
	}
	li {
		@apply mr-6 md:mx-6;
	}
</style>