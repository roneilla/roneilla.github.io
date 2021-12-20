<template>
	<main class="bg-main-light w-full p-4">
		<div class="rb-section-min-height flex flex-col justify-between">
			<div class="w-full mb-6">
				<h2 class="md:w-6/12 lg:w-4/12 leading-none">
					These are some of the side projects I'm working on:
				</h2>
			</div>
			<div class="flex flex-col md:flex-row">
				<div class="flex-1 my-4 md:mr-2">
					<h3>A financial tracker for new adults</h3>
					<p>Why?</p>
					<ul class="list-disc pl-4">
						<li>No financial app has met my needs! So I’m making one.</li>
						<li>Improve my development and UX design skills</li>
					</ul>
				</div>
				<div class="flex-1 my-4 md:mx-2">
					<h3>A memory journal web app</h3>
					<p>Why?</p>
					<ul class="list-disc pl-4">
						<li>
							Building a web app from scratch to improve my development skills
							using the MERN stack
						</li>
					</ul>
				</div>
				<div class="flex-1 my-4 md:ml-2"><EyeAnimate /></div>
			</div>
			<div class="md:text-center my-4">
				Interested in learning more or working together? Contact me!
			</div>
		</div>
		<div class="rb-border-top py-4">
			<div class="flex justify-between items-center">
				<span class="flex items-center">
					<h2 class="inline text-2xl pr-4">Gallery</h2>
					<img class="inline h-6" src="~/assets/images/down-arrow.svg" alt="" />
				</span>
			</div>
		</div>
	</main>
</template>

<script>
	import EyeAnimate from '../components/EyeAnimate.vue'
	export default {
		components: { EyeAnimate },
	}
</script>

<style scoped>
	h3 {
		@apply leading-none mb-4;
	}
</style>