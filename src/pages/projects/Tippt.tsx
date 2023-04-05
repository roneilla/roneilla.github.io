import React from 'react'
import ProjectHeader from '../../components/ProjectHeader'
import TipptHeader from './../../assets/tippt.png'

interface TipptProps {
    imageDetails: any;
}

const Tippt = ({ imageDetails }: TipptProps) => {
    return (
        <div>
            <ProjectHeader
                imageDetails={imageDetails}
                name="Tippt App"
                description="A platform providing users with quick access to information they need to make sustainable choices"
                img={TipptHeader}
            />
        </div>
    )
}

export default Tippt