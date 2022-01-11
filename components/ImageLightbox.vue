<template>
	<div class="my-12">
		<img :src="require('~/assets/images/' + img)" alt="" @click="toggle" />
		<p class="caption">{{ description }}</p>

		<div
			class="lightbox text-right"
			:class="{ active: active }"
			@click="toggleOutside"
		>
			<p class="underline uppercase" @click="toggle">Close</p>
			<img :src="require('~/assets/images/' + img)" alt="" />
			<p class="text-center w-full">{{ description }}</p>
		</div>
	</div>
</template>

<script>
	export default {
		props: ["img", "description"],
		data() {
			return {
				active: false,
			};
		},
		mounted() {},
		methods: {
			toggle() {
				this.active = !this.active;
			},
			toggleOutside(e) {
				if (e.target == e.currentTarget) this.active = !this.active;
			},
		},
	};
</script>

<style scoped>
	.lightbox {
		position: fixed;
		z-index: 1000;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.4);
		display: none;
		flex-direction: column;
		justify-content: center;
		align-items: flex-end;
		backdrop-filter: blur(6px);
	}

	.lightbox.active {
		display: flex;
	}

	.lightbox img {
		max-width: 100%;
		max-height: 100%;
		padding: 0 1rem;
		object-fit: contain;
		margin: 1rem auto;
	}

	.lightbox p {
		color: white;
		margin: 1rem;
	}

	.caption {
		@apply text-grey w-full text-center italic py-2;
	}
</style>