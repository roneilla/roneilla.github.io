<template>
	<main class="bg-main-light w-full p-4">
		<div class="flex justify-between items-center">
			<div>
				<img src="~/assets/images/star-solid.svg" alt="" />
			</div>
			<div>
				<span class="flex items-center">
					<h2 class="inline text-xl pr-2">View my Resume</h2>
					<img
						class="inline h-4"
						src="~/assets/images/right-arrow.svg"
						alt=""
					/>
				</span>
			</div>
		</div>
		<div class="flex flex-col md:flex-row">
			<div class="about-me flex-1 mr-4">
				<h2 class="text-3xl mt-4">Hi, I’m Roneilla!</h2>
				<p class="text-xl mb-4">pronounced ro-NEY-la • she/her</p>
				<p class="my-2">
					I recently graduated from Sheridan College with a Bachelor’s Degree in
					Interaction Design. I’m currently working at global brand experience
					agency ASTOUND Group, designing and developing brand and customer
					experiences. In between projects, I do a lot of R&amp;D exploring new
					and emerging technology.
					<br /><br />
					I’m still trying to find my guiding purpose in my work - but currently
					I’m most passionate about financial literacy, education, and
					psychology.
					<br /><br />
					Aside from design and development, I also have experience in physical
					computing, content creation (videos/photos), fabrication, 2d
					animation, and more – I’m a quick learner who took the term
					<span title="a master of none, but better than a master of one">
						<i> “jack of all trades” </i></span
					>
					to heart.
					<br />
					<br />
					Outside of work and projects, I like to cook, decorate my apartment,
					and watch
					<span title="Immigrants, we get the job done."> musicals.</span>
					I’m currently reading Atomic Habits by James Clear and listening to
					Red (Taylor’s Version) by Taylor Swift.
				</p>
				<p>Reach out to me for:</p>
				<ul class="list-disc pl-4">
					<li>
						<a href="https://www.tutorocean.com/tutor/roneilla" target="_blank"
							>Tutoring</a
						>
					</li>
					<li>Mentorship</li>
					<li>Project Collaboration</li>
					<li>Freelance Work</li>
				</ul>
			</div>
			<div
				class="
					flex-1 flex flex-row
					md:flex-col
					lg:flex-row
					items-center
					justify-center
				"
			>
				<div class="m-4 xl:self-start">
					<img src="~/assets/images/roneillabumanlag-headshot.png" alt="" />
				</div>
				<div class="m-4 xl:self-end">
					<img src="~/assets/images/roneillabumanlag-sketch.png" alt="" />
					<p class="text-grey leading-snug mt-2 text-xs">
						Drawing by Ming Tsang –
						<a
							href="https://tsangka.myportfolio.com/home"
							class="underline"
							target="_blank"
						>
							Ming's Portfolio</a
						>
					</p>
				</div>
			</div>

			<!-- <div class="photo-grid grid flex-1 max-80vh relative ml-4">
				<div class="z-1 col-span-4">
					<img src="~/assets/images/roneillabumanlag-headshot.png" alt="" />
				</div>
				<div class="z-50 col-start-3 row-start-6 col-span-4">
					<img src="~/assets/images/roneillabumanlag-sketch.png" alt="" />
					<p class="text-grey leading-snug mt-2 text-xs">
						Drawing by Ming Tsang –
						<a
							href="https://tsangka.myportfolio.com/home"
							class="underline"
							target="_blank"
						>
							Ming's Portfolio</a
						>
					</p>
				</div>
				<div class="z-2 col-start-6 row-start-2 col-span-4 ml-6">
					<img src="~/assets/images/roneillabumanlag-ripleys.png" alt="" />
				</div>
				<div class="z-10 col-start-8 row-start-7 col-span-5">
					<img src="~/assets/images/roneillabumanlag-dogs.png" alt="" />
				</div>
			</div> -->
		</div>
	</main>
</template>

<script>
	export default {}
</script>

<style scoped>
	img {
		@apply object-contain;
	}

	.photo-grid {
		grid-template-rows: repeat(12, minmax(0, 1fr));
		grid-template-columns: repeat(12, minmax(0, 1fr));
		grid-gap: 0.5rem;
		max-width: 830px;
	}
</style>