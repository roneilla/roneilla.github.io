<template>
	<div class="grid grid-cols-1 sm:grid-cols-12 gap-8 p-4 main-container">
		<div class="row-start-1 col-span-1 sm:col-span-8">
			<h1
				class="text-5xl"
				data-aos="fade-up"
				data-aos-easing="ease"
				data-aos-delay="300"
			>
				I’m Roneilla Bumanlag – an Interaction Designer & Creative Developer
				based in Toronto.
			</h1>
		</div>
		<div
			class="row-start-2 col-span-1 sm:col-span-8 sm:col-start-5"
			data-aos="fade-up"
			data-aos-easing="ease"
			data-aos-delay="400"
		>
			<p class="py-2">
				I recently graduated from Sheridan College with a Bachelor’s Degree in
				Interaction Design. I’m currently working at global brand experience
				agency ASTOUND Group, designing and developing brand and customer
				experiences. In between projects, I do a lot of R&D exploring new and
				emerging technology.
			</p>
			<p class="py-2">
				Aside from design and development, I also have experience in physical
				computing, content creation (videos/photos/2D animation), fabrication,
				and more – I’m a quick learner who took the term “jack of all trades” to
				heart.
			</p>
			<p class="py-2">
				Reach out to me for tutoring, mentorship, collaborations, and freelance
				work.
			</p>
			<p class="pt-2">Find me on the internet!!!</p>
			<ul class="list-disc pl-4 pb-2">
				<li>
					<div
						class="inline-block underline cursor-pointer"
						@click="showOptions"
						data-cursor-hover
					>
						Send me an email
					</div>
					<div class="inline-block pl-6" id="options">
						<a
							data-cursor-hover
							class="pr-3"
							target="_blank"
							href="mailto:roneillabumanlag@gmail.com"
						>
							Open Mail
							<img
								class="inline-img"
								src="~assets/images/link-arrow.png"
								alt=""
							/>
						</a>
						<button class="inline-block" @click="copyEmail" data-cursor-hover>
							<div class="inline-block" id="copy-msg">Copy Email</div>
							<img class="inline-img" src="~/assets/images/copy.png" alt="" />
						</button>
					</div>
				</li>
				<li>
					<a
						data-cursor-hover
						class="underline"
						target="_blank"
						href="https://www.linkedin.com/in/roneilla/"
						>Connect with me on LinkedIn
					</a>
				</li>
				<li>
					<a
						data-cursor-hover
						class="underline"
						target="_blank"
						href="https://dribbble.com/roneilla"
						>Look at my work on Dribbble</a
					>
				</li>
				<li>
					<a
						data-cursor-hover
						class="underline"
						target="_blank"
						href="https://www.instagram.com/eillamadethis/"
						>Find out what I’m up to on Instagram</a
					>
				</li>
				<li>
					<a
						data-cursor-hover
						class="underline"
						target="_blank"
						href="https://www.tutorocean.com/tutor/roneilla"
						>Book a session on TutorOcean</a
					>
				</li>
			</ul>
		</div>
		<div
			class="row-start-3 col-span-1 sm:col-span-8"
			data-aos="fade-up"
			data-aos-easing="ease"
			data-aos-delay="300"
		>
			<h2 class="text-5xl">
				These are some things I’ve worked on
				<span style="white-space: nowrap">recently –</span>
			</h2>
		</div>
		<div class="row-start-4 col-span-1 sm:col-span-8 sm:col-start-5">
			<div
				class="py-4 work-card"
				v-for="(work, index) in works"
				:key="index"
				data-aos="fade-up"
				data-aos-easing="ease"
				data-aos-delay="300"
				data-cursor-hover
			>
				<a :href="work.link" target="_blank">
					<div class="flex justify-between items-start gap-4">
						<div class="flex-1">
							<h3 class="text-xl mb-2">{{ work.name }}</h3>
							<p>
								<span style="font-weight: 500">{{ work.role }}</span>
								{{ work.description }}
							</p>
							<p class="italic text-sm pt-2">Tools: {{ work.tools }}</p>
						</div>
						<div class="flex-initial">
							<img
								class="link-img mt-2"
								src="~/assets/images/link-arrow.png"
								alt=""
							/>
						</div>
					</div>
				</a>
			</div>
		</div>
	</div>
</template>

<script>
	import { recentWork } from "../data";

	export default {
		data() {
			return {
				works: recentWork,
			};
		},
		name: "IndexPage",
		methods: {
			showOptions(e) {
				document.getElementById("options").style.display = "inline-block";
				e.target.classList.add("animated-click");
				setTimeout(() => {
					e.target.classList.remove("animated-click");
				}, 200);
			},
			copyEmail(e) {
				navigator.clipboard.writeText("roneillabumanlag@gmail.com");
				e.target.classList.add("animated-click");
				document.getElementById("copy-msg").classList.add("animated-move");

				setTimeout(() => {
					document.getElementById("copy-msg").innerHTML = "Copied!";
				}, 550);

				setTimeout(() => {
					e.target.classList.remove("animated-click");
				}, 200);
				setTimeout(() => {
					document.getElementById("copy-msg").classList.remove("animated-move");
					document.getElementById("copy-msg").innerHTML = "Copy Email";
				}, 5000);
			},
		},
	};
</script>

<style scoped>
	.main-container {
		grid-template-rows: repeat(4, auto);
	}

	.inline-img {
		height: 0.8rem;
		width: auto;
		object-fit: contain;
		display: inline;
	}

	.link-img {
		max-width: 30px;
		height: auto;
		object-fit: contain;
	}

	.animated-click {
		animation-name: clicked;
		animation-duration: 0.2s;
		animation-iteration-count: 1;
		animation-timing-function: ease;
		animation-fill-mode: forwards;
	}

	@keyframes clicked {
		0% {
			opacity: 0.5;
		}

		100% {
			opacity: 1;
		}
	}

	@keyframes fadeinout {
		0% {
			opacity: 0;
			transform: translate(0, 4px);
		}
		15% {
			opacity: 1;
			transform: translate(0, 0px);
		}
		85% {
			opacity: 1;
			transform: translate(0, 0px);
		}
		100% {
			opacity: 0;
			transform: translate(0, -4px);
		}
	}

	@keyframes moveUp {
		0% {
			opacity: 1;
			transform: translate(0, 0px);
		}
		50% {
			opacity: 0;

			transform: translate(0, -4px);
		}
		51% {
			opacity: 0;

			transform: translate(0, 4px);
		}
		100% {
			opacity: 1;
			transform: translate(0, 0px);
		}
	}

	.animated-move {
		animation-name: moveUp;
		animation-duration: 1s;
		animation-iteration-count: 1;
		animation-timing-function: ease;
		animation-fill-mode: forwards;
	}

	.animated-show {
		animation-name: fadeinout;
		animation-duration: 2s;
		animation-iteration-count: 1;
		animation-timing-function: ease;
		animation-fill-mode: forwards;
	}

	#options {
		display: none;
	}
</style>