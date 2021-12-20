<template>
	<main class="bg-main-light w-full p-4">
		<div class="flex justify-between items-center">
			<span class="flex items-center">
				<h2 class="inline text-2xl pr-4">Things I've created/built</h2>
				<img class="inline h-6" src="~/assets/images/down-arrow.svg" alt="" />
			</span>
		</div>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			<div v-for="(caseStudy, index) in caseStudies" :key="index">
				<NuxtLink :to="`/work/${caseStudy.link}`">
					<div class="flex items-start justify-start my-8 flex-col">
						<div class="flex-1 pr-6 order-2">
							<h3 class="mt-6 leading-tight">{{ caseStudy.title }}</h3>
							<div>
								<div
									class="tag"
									v-for="(tag, index) in caseStudy.tags"
									:key="index"
								>
									{{ tag }}
								</div>
							</div>
							<p class="my-2">{{ caseStudy.description }}</p>
						</div>
						<div class="flex-initial order-1">
							<img
								:src="require('~/assets/images/' + caseStudy.imgSrc)"
								alt=""
							/>
						</div>
					</div>
				</NuxtLink>
			</div>
		</div>
	</main>
</template>

<script>
	import { caseStudies } from '~/data.js'

	export default {
		name: 'caseStudies',
		data() {
			return {
				caseStudies: caseStudies,
			}
		},
	}
</script>

<style scoped>
</style>