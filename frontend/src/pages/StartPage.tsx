import React from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import  NavMain  from '../componets/NavMain'
import  Header  from '../componets/Header'
import  Footer  from '../componets/Footer'
export const StartPage = () => {
  return (
    <div className="d-flex flex-column h-100">
      <NavMain/>
      <Header/>
      <Footer/>
    </div>
  )
}
