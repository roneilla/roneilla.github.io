<template>
	<div style="height: 3.75rem" class="bg-main-light w-full px-4">
		<nav
			class="
				h-full
				rb-border-bottom
				bg-main-light
				flex
				items-center
				justify-between
				px-4
				py-4
				uppercase
				text-base
				z-10
				relative
			"
		>
			<div>
				<NuxtLink to="/" class="flex justify-start items-center">
					<img
						style="max-height: 2rem"
						class="inline"
						src="~/assets/images/star-outline.svg"
						alt=""
					/>
					<p class="ml-4">Roneilla Bumanlag</p>
				</NuxtLink>
			</div>
			<!-- <div class="text-center flex-initial hidden lg:block">
				<NuxtLink to="/">
					<img src="~/assets/images/star-outline.svg" alt="" />
				</NuxtLink>
			</div> -->
			<ul class="items-center justify-end flex-1 md:flex hidden">
				<!-- <li>
					<NuxtLink to="/"> Home </NuxtLink>
				</li> -->
				<li>
					<NuxtLink to="/work"> Work </NuxtLink>
				</li>
				<li>
					<NuxtLink to="/afterhours"> After Hours </NuxtLink>
				</li>
				<li>
					<NuxtLink to="/about"> About </NuxtLink>
				</li>
				<li>
					<NuxtLink to=""> Contact </NuxtLink>
				</li>
			</ul>

			<div class="md:hidden block underline" @click="toggleMenu">Menu</div>
		</nav>

		<div
			id="mobile-menu"
			class="bg-main-light z-0 relative p-6"
			:class="{ 'nav-display': toggle, 'nav-hidden': !toggle }"
		>
			<ul
				class="
					flex
					items-center
					flex-col
					justify-end
					flex-1
					md:hidden
					block
					my-4
					uppercase
					text-base
					font-medium
				"
			>
				<!-- <li>
					<NuxtLink to="/"> Home </NuxtLink>
				</li> -->
				<li>
					<NuxtLink to="/work"> Work </NuxtLink>
				</li>
				<li>
					<NuxtLink to="/afterhours"> After Hours </NuxtLink>
				</li>
				<li>
					<NuxtLink to="/about"> About </NuxtLink>
				</li>
				<li>
					<NuxtLink to=""> Contact </NuxtLink>
				</li>
			</ul>
		</div>
	</div>
</template>

<script>
	export default {
		data() {
			return {
				toggle: false,
			}
		},
		methods: {
			toggleMenu() {
				this.toggle = !this.toggle
				console.log(this.toggle)
			},
		},
	}
</script>

<style scoped>
	nav {
		@apply font-medium;
	}
	li {
		@apply mx-3;
	}

	li:hover {
		text-decoration: underline;
	}

	#mobile-menu {
		transition: transform 1s ease-in-out;
	}

	.nav-hidden {
		transform: translate(0, -100vw);
	}

	.nav-display {
		transform: translate(0, 0);
	}
</style>