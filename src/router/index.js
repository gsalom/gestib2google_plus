import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

let router = new Router({
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/Home')
    },
    {
      path: '/users',
      name: 'Users',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('@/views/Users')
    },
    {
      path: '/spreadsheet',
      name: 'Spreadsheet',
      component: () => import('@/views/Spreadsheet')
    },
    {
      path: '/csv',
      name: 'Csv',
      component: () => import('@/views/Csv')
    },
    {
      path: '/importxml',
      name: 'ImportXml',
      component: () => import('@/views/ImportXml')
    },
    {
      path: '/utilsusers',
      name: 'UtilsUsers',
      component: () => import('@/views/UtilsUsers')
    },
    {
      path: '/setup',
      name: 'Setup',
      component: () => import('@/views/Setup')
    }
  ]
})

export default router
