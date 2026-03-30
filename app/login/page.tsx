
import { Loader2Icon } from 'lucide-react'
import React, { Suspense } from 'react'
import LoginPage from './_component/login'



const page = () => {
  return (
    <Suspense fallback={<Loader2Icon className=' animate-spin size-4'/>}>
      <LoginPage/>
    </Suspense>
  )
}

export default page