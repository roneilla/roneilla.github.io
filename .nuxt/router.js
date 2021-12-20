import Vue from 'vue'
import Router from 'vue-router'
import { normalizeURL, decode } from 'ufo'
import { interopDefault } from './utils'
import scrollBehavior from './router.scrollBehavior.js'

const _d87b7224 = () => interopDefault(import('../pages/about.vue' /* webpackChunkName: "pages/about" */))
const _05745222 = () => interopDefault(import('../pages/afterhours.vue' /* webpackChunkName: "pages/afterhours" */))
const _39e0197a = () => interopDefault(import('../pages/work/index.vue' /* webpackChunkName: "pages/work/index" */))
const _701ae060 = () => interopDefault(import('../pages/work/tippt.vue' /* webpackChunkName: "pages/work/tippt" */))
const _990bbc9a = () => interopDefault(import('../pages/index.vue' /* webpackChunkName: "pages/index" */))

const emptyFn = () => {}

Vue.use(Router)

export const routerOptions = {
  mode: 'history',
  base: '/',
  linkActiveClass: 'nuxt-link-active',
  linkExactActiveClass: 'nuxt-link-exact-active',
  scrollBehavior,

  routes: [{
    path: "/about",
    component: _d87b7224,
    name: "about"
  }, {
    path: "/afterhours",
    component: _05745222,
    name: "afterhours"
  }, {
    path: "/work",
    component: _39e0197a,
    name: "work"
  }, {
    path: "/work/tippt",
    component: _701ae060,
    name: "work-tippt"
  }, {
    path: "/",
    component: _990bbc9a,
    name: "index"
  }],

  fallback: false
}

export function createRouter (ssrContext, config) {
  const base = (config._app && config._app.basePath) || routerOptions.base
  const router = new Router({ ...routerOptions, base  })

  // TODO: remove in Nuxt 3
  const originalPush = router.push
  router.push = function push (location, onComplete = emptyFn, onAbort) {
    return originalPush.call(this, location, onComplete, onAbort)
  }

  const resolve = router.resolve.bind(router)
  router.resolve = (to, current, append) => {
    if (typeof to === 'string') {
      to = normalizeURL(to)
    }
    return resolve(to, current, append)
  }

  return router
}
