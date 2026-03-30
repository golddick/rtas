
import { Loader2Icon } from 'lucide-react'
import React, { Suspense } from 'react'
import VerifyEmailPage from '../_component/email-verify'


const page = () => {
  return (
    <Suspense fallback={<Loader2Icon className=' animate-spin size-4'/>}>
      <VerifyEmailPage/>
    </Suspense>
  )
}

export default page