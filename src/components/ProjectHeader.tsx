import React from 'react'
import { motion } from 'framer-motion'

interface ProjectHeaderProps {
    name: string;
    description: string;
    img?: any;
    imageDetails: any;
}


const ProjectHeader = ({ name, description, img, imageDetails }: ProjectHeaderProps) => {
    const textTransition = { duration: 1 }

    return (
        <>
            <div className='mx-auto max-w-screen-sm mb-8 mt-4'>
                <motion.div
                    key={`header-name-${name}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={textTransition}
                >
                    <h1 className='font-serif font-medium text-2xl text-primary'>{name}</h1>
                </motion.div>
                <motion.div
                    key={`header-description-${name}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.1, ...textTransition }}
                >
                    <p className='text-primary mt-1'>{description}</p>
                </motion.div>
            </div >
            {img ?
                <motion.div
                    key={`header-img-${name}`}
                    initial={{
                        opacity: 0,
                        width: imageDetails.width,
                        height: imageDetails.height
                    }}
                    animate={{
                        opacity: 1,
                        width: '100%',
                        height: 400
                    }}>
                    <img src={img} alt={name} />
                </motion.div>
                : <div className='bg-primary m-4' style={{ height: 400 }}></div>}
        </>
    )
}

export default ProjectHeader