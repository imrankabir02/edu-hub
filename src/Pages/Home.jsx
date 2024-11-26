import React from 'react'
import Card from '../Components/Card'
import Hero from '../Components/Hero'
import Pricing from '../Components/Pricing'
import VisitorCounter from '../Components/VisitorCounter'

export default function Home() {
  return (
    <div>
      <Hero/>
      <Pricing/>
      <VisitorCounter/>
    </div>
  )
}
