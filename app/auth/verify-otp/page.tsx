
import { Loader2Icon } from 'lucide-react'
import React, { Suspense } from 'react'
import VerifyOTPPage from '../admin/_component/verify-otp'



const page = () => {
  return (
    <Suspense fallback={<Loader2Icon className=' animate-spin size-4'/>}>
      <VerifyOTPPage/>
    </Suspense>
  )
}

export default page