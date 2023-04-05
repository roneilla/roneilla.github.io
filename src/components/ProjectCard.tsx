import React from 'react'
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion'

interface ProjectProps {
    name: string;
    description: string;
    img?: any;
    link: string;
    imageDetails: any;
}

export const ProjectCard = ({ name, description, link, img, imageDetails }: ProjectProps) => {
    return (
        <motion.div
            key={`card-${name}`}
            // initial={{ opacity: 0, y: 10 }}
            // animate={{ opacity: 1, y: 0 }}
            // exit={{ opacity: 0, y: 10 }}
            className='basis-1/3 p-4'
        >
            <Link to={'/' + link} >
                <div style={{ width: imageDetails.width, height: imageDetails.height }} className='relative mb-2'>
                    {img ?
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={`card-img-${name}`}
                                whileHover={{ scale: 1.2 }}
                                initial={{
                                    scale: 1,
                                    // width: '100%',
                                    // height: '100%'
                                }}
                                exit={{
                                    // width: '100vw',
                                    // height: '100vh'
                                    scale: 500
                                }}
                                src={img}
                                alt={name}
                                className='absolute top-0 bottom-0 w-full h-full object-cover'
                            /></AnimatePresence>
                        : <div
                            className='bg-primary absolute top-0 bottom-0 w-full h-full'>
                        </div>
                    }
                </div>
                < h3 className="font-serif text-primary text-xl" > {name}</h3 >
                <p className='text-primary'>{description}</p>
            </Link>
        </motion.div >
    )
}
