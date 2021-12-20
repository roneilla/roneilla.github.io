<template>
	<div>
		<div v-for="(caseStudy, index) in caseStudies" :key="index">
			<NuxtLink
				v-if="caseStudy.type === 'featured'"
				:to="`/work/${caseStudy.link}`"
			>
				<div
					class="
						flex
						items-start
						justify-start
						md:justify-center md:items-center
						my-8
						flex-col
						md:flex-row
					"
				>
					<div class="flex-1 pr-6 order-2 md:order-1">
						<h3 class="my-2 leading-tight">{{ caseStudy.title }}</h3>
						<div class="my-2">
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
					<div class="flex-initial order-1 md:order-2">
						<img :src="require('~/assets/images/' + caseStudy.imgSrc)" alt="" />
					</div>
				</div>
			</NuxtLink>
		</div>
	</div>
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
	img {
		width: 100%;
		object-fit: cover;
	}

	@screen md {
		img {
			max-width: 600px;
			width: 100%;
			object-fit: cover;
		}
	}
</style>