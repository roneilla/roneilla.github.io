import React from 'react'
import { Arrow } from '../assets/Arrow'
import Asperand from '../assets/Asperand'
import { useMatch, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'


export const Nav = () => {

  const isHome = useMatch('/')
  const navigate = useNavigate()

  const transition = { duration: 0.2, ease: [0.17, 0.67, 0.83, 0.67] }

  return (
    <div className={`flex px-4 pt-3 pb-2 justify-between items-center`} >
      <div className="basis-12">
        {!isHome &&
          <motion.div
            key="backArrow"
            transition={transition}
            whileHover={{ scale: 1.2 }}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            className='inline-block cursor-pointer bg-background hover:bg-primary fill-primary hover:fill-background p-3 rounded-full border-primary border-solid border'
            onClick={() => navigate(-1)}>
            <Arrow />
          </ motion.div>
        }
      </div>

      <h1 className='grow text-center font-serif font-medium text-xl text-primary'>Roneilla Bumanlag</h1>

      <div className='text-right basis-12'>
        <motion.div
          key='asperand'
          transition={transition}
          whileHover={{ scale: 1.2 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='inline-block cursor-pointer bg-background hover:bg-primary fill-primary hover:fill-background p-3 rounded-full border-primary border-solid border'>
          <Asperand />
        </ motion.div>
      </div>
    </div >
  )
}
