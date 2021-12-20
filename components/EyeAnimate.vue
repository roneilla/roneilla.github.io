<template>
	<div class="flex justify-center items-center flex-col h-full">
		<div class="eye-wrapper">
			<div class="eye">
				<div class="pupil"></div>
			</div>
			<div class="eye">
				<div class="pupil"></div>
			</div>
		</div>
		<div class="">More projects coming soon!</div>
	</div>
</template>

<script>
	export default {
		data() {
			return {}
		},
		mounted() {
			window.addEventListener('mousemove', this.onmousemove)
		},
		methods: {
			onmousemove(event) {
				const eyes = document.getElementsByClassName('pupil')

				for (let i = 0; i < eyes.length; i++) {
					const eye = eyes[i]

					const ox = eye.offsetLeft + eye.offsetWidth / 2
					const oy = eye.offsetTop + eye.offsetHeight / 2
					// const rad = Math.atan2(event.pageX - x, event.pageY - y)
					// const rot = rad * (180 / Math.PI) * -1 + 180

					const x = this.mapRange(event.pageX, 0, window.innerWidth, -2, 14)
					const y = this.mapRange(event.pageY, 0, window.innerHeight, -11, 10)

					eye.style.webkitTransform = `translate(${x}px, ${y}px)`
					eye.style.msTransform = `translate(${x}px, ${y}px)`
					eye.style.mozTransform = `translate(${x}px, ${y}px)`
					eye.style.transform = `translate(${x}px, ${y}px)`
				}
			},

			mapRange(val, in_min, in_max, out_min, out_max) {
				return (
					((val - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
				)
			},
		},
	}
</script>

<style scoped>
	.eye-wrapper {
		width: 100%;
		text-align: center;
	}
	.eye {
		position: relative;
		display: inline-block;
		border-radius: 50%;
		height: 50px;
		width: 30px;
		border: 2px solid black;
	}
	.pupil {
		position: absolute;
		bottom: 14px;
		right: 16px;
		width: 10px;
		height: 20px;
		background: #000;
		border-radius: 50%;
		content: ' ';
	}
</style>